// @ts-nocheck
import domtoimage from "dom-to-image";
import { Figure } from "react-plotly.js";
import * as Plotly from "plotly.js-dist-min";

const exportNativeFileSystem = async ({
  fileHandle,
  blob,
}: {
  fileHandle?: FileSystemFileHandle | null;
  blob: Blob;
}) => {
  if (!fileHandle) {
    return;
  }

  return writeFileHandler({ fileHandle, blob });
};

const writeFileHandler = async ({
  fileHandle,
  blob,
}: {
  fileHandle: FileSystemFileHandle;
  blob: Blob;
}) => {
  const writer = await fileHandle.createWritable();
  await writer.write(blob);
  await writer.close();
};

const IMAGE_TYPE: FilePickerAcceptType[] = [
  {
    description: "PNG Image",
    accept: {
      "image/png": [".png"],
    },
  },
  {
    description: "JPEG Image",
    accept: {
      "image/jpeg": [".jpeg"],
    },
  },
  {
    description: "SVG Image",
    accept: {
      "image/svg+xml": [".svg"],
    },
  },
];

const getNewFileHandle = ({
  filename,
  is_image,
}: {
  filename: string;
  is_image?: boolean;
}): Promise<FileSystemFileHandle | null> => {
  if ("showSaveFilePicker" in window) {
    const opts: SaveFilePickerOptions = {
      suggestedName: filename,
      types: is_image
        ? IMAGE_TYPE
        : [
            {
              description: "CSV File",
              accept: {
                "image/csv": [".csv"],
              },
            },
          ],
      excludeAcceptAllOption: true,
    };

    return showSaveFilePicker(opts);
  }

  return new Promise((resolve) => {
    resolve(null);
  });
};

export const saveToFile = (
  blob: Blob,
  fileName: string,
  fileHandle?: FileSystemFileHandle | null
) => {
  try {
    if (fileHandle === null) {
      throw new Error("Cannot access filesystem");
    }
    return exportNativeFileSystem({ fileHandle, blob });
  } catch (error) {
    console.error("oops, something went wrong!", error);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  return new Promise((resolve) => {
    resolve(true);
  });
};

export async function downloadCSV(gd: Figure) {
  let data = gd.data;
  let columns: string[] = [];
  let rows: any[] = [];

  let xaxis =
    "title" in gd.layout["xaxis"] &&
    gd.layout["xaxis"]["title"]["text"] != undefined
      ? gd.layout["xaxis"]["title"]["text"]
      : "x";

  let yaxis =
    "title" in gd.layout["yaxis"] &&
    gd.layout["yaxis"]["title"]["text"] != undefined
      ? gd.layout["yaxis"]["title"]["text"]
      : "y";

  data.forEach(function (trace) {
    if (trace.type == "candlestick") {
      if (columns.length == 0) {
        columns = ["Date", "Open", "High", "Low", "Close"];
      }
      trace.x.forEach(function (x, i) {
        rows.push([
          x,
          trace.open[i],
          trace.high[i],
          trace.low[i],
          trace.close[i],
        ]);
      });
    }

    if (trace.type == "scatter") {
      if (columns.length == 0) {
        columns.push(xaxis);
      }
      columns.push(trace.name);
      trace.x.forEach(function (x, i) {
        if (rows[i] == undefined) {
          rows[i] = [x];
        }
        rows[i].push(trace.y[i]);
      });
    }
  });

  return await downloadData(columns, rows);
}

export async function downloadData(columns: any, data: any) {
  const headers = columns;
  const rows = data.map((row: any) =>
    row.map((cell: any) => {
      if (cell == null) {
        return "";
      } else if (typeof cell === "object") {
        return JSON.stringify(cell);
      } else {
        return cell.toString().replace(/"/g, '""');
      }
    })
  );
  const csvData = [headers, ...rows];

  const csvContent = csvData.map((e) => e.join(",")).join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const filename = `${window.title}.csv`;
  try {
    let fileHandle = await getNewFileHandle({
      filename: filename,
    });
    let ext: string = "png";
    if (fileHandle !== null) {
      // @ts-ignore
      ext = fileHandle.name.split(".").pop();
    }
    await loadingOverlay(`Saving ${ext.toUpperCase()}`);
    non_blocking(async function () {
      // @ts-ignore
      saveToFile(blob, filename, fileHandle).then(async function () {
        await loadingOverlay("", true);
      });
    }, 2)();
  } catch (error) {
    console.error(error);
  }
}

function loadingOverlay(message?: string, is_close?: boolean) {
  const loading = window.document.getElementById("loading") as HTMLElement;
  const loading_text = window.document.getElementById(
    "loading_text"
  ) as HTMLElement;
  return new Promise((resolve) => {
    if (is_close) {
      loading.classList.remove("show");
    } else {
      // @ts-ignore
      loading_text.innerHTML = message;
      loading.classList.add("show");
    }

    let is_loaded = setInterval(function () {
      if (
        is_close
          ? !loading.classList.contains("show")
          : loading.classList.contains("show")
      ) {
        clearInterval(is_loaded);
        resolve(true);
      }
    }, 0.1);
  });
}

export const non_blocking = (func: Function, delay: number) => {
  let timeout: number;
  return function () {
    // @ts-ignore
    const context = this;
    const args = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
};

const openbb_watermark = {
  yref: "paper",
  xref: "paper",
  x: 1,
  y: 0,
  text: "OpenBB Terminal",
  font_size: 17,
  font_color: "gray",
  opacity: 0.5,
  xanchor: "right",
  yanchor: "bottom",
  yshift: -80,
  xshift: 40,
};

async function setWatermarks(margin, old_index, init = false) {
  const chart = document.getElementById("plotlyChart") as HTMLElement;

  if (init) {
    chart.layout.annotations.push(openbb_watermark);
    if (
      chart.globals.cmd_idx != undefined &&
      chart.globals.cmd_src != undefined
    ) {
      chart.layout.annotations[chart.globals.cmd_idx].text =
        chart.globals.cmd_src;
    }

    Plotly.relayout(chart, {
      "title.text": chart.globals.title,
      margin: chart.globals.old_margin,
    });
  }

  if (!init) {
    if (
      chart.globals.cmd_idx != undefined &&
      chart.globals.cmd_src != undefined
    ) {
      chart.layout.annotations[chart.globals.cmd_idx].text = "";
    }
    chart.layout.annotations.splice(old_index, 1);

    Plotly.relayout(chart, {
      "title.text": "",
      margin: margin,
    });
  }
}

export async function saveImage(
  id: string,
  filename: string,
  extension: string
) {
  const chart = document.getElementById(id) as HTMLElement;

  if (["svg", "pdf"].includes(extension)) {
    const chart = document.getElementById("plotlyChart") as HTMLElement;
    const margin = chart.layout.margin;
    const old_index = chart.layout.annotations.length;

    await setWatermarks(margin, old_index, true);

    Plotly.downloadImage(chart, {
      format: "svg",
      height: chart.clientHeight,
      width: chart.clientWidth,
      filename: window.title,
    });

    await setWatermarks(margin, old_index, false);
    await loadingOverlay("", true);

    return;
  }

  non_blocking(async function () {
    domtoimage.toBlob(chart).then(function (blob: Blob) {
      saveToFile(blob, filename, null);
    });
  }, 2)();
}

export async function downloadImage(
  id: string,
  hidemodebar: () => void,
  loading: (bool: boolean) => void
) {
  const chart = document.getElementById(id) as HTMLElement;
  const filename = `${window.title}.png`;

  try {
    let fileHandle = await getNewFileHandle({
      filename: filename,
      is_image: true,
    });
    let extension: string = "png";
    if (fileHandle !== null) {
      // @ts-ignore
      extension = fileHandle.name.split(".").pop();
    }
    loading(true);
    await loadingOverlay(`Saving ${extension.toUpperCase()}`);

    if (["svg", "pdf"].includes(extension)) {
      await saveImage(id, filename, extension);
      hidemodebar(false);
      loading(false);
      return;
    }

    non_blocking(async function () {
      domtoimage.toBlob(chart).then(function (blob: Blob) {
        saveToFile(blob, filename, fileHandle).then(async function () {
          await loadingOverlay("", true);
          hidemodebar(false);
        });
      });
    }, 2)();
    loading(false);
  } catch (error) {
    console.error(error);
    hidemodebar(false);
  }
}
