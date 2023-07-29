"""FMP Historical Dividends fetcher."""

from datetime import (
    date as dateType,
    datetime,
)
from typing import Any, Dict, List, Optional

from openbb_provider.abstract.data import Data
from openbb_provider.abstract.fetcher import Fetcher
from openbb_provider.models.historical_dividends import (
    HistoricalDividendsData,
    HistoricalDividendsQueryParams,
)
from pydantic import validator

from openbb_fmp.utils.helpers import create_url, get_data_many


class FMPHistoricalDividendsQueryParams(HistoricalDividendsQueryParams):
    """FMP Historical Dividends query.

    Source: https://site.financialmodelingprep.com/developer/docs/#Historical-Dividends

    Parameter
    ---------
    symbol : str
        The symbol of the company.
    """


class FMPHistoricalDividendsData(Data):
    """FMP Historical Dividends data."""

    date: dateType
    label: str
    adjDividend: float
    dividend: float
    recordDate: Optional[dateType]
    paymentDate: Optional[dateType]
    declarationDate: Optional[dateType]

    @validator("declarationDate", pre=True)
    def declaration_date_validate(cls, v: str):  # pylint: disable=E0213
        return datetime.strptime(v, "%Y-%m-%d") if v else None

    @validator("recordDate", pre=True)
    def record_date_validate(cls, v: str):  # pylint: disable=E0213
        return datetime.strptime(v, "%Y-%m-%d") if v else None

    @validator("paymentDate", pre=True)
    def payment_date_validate(cls, v: str):  # pylint: disable=E0213
        return datetime.strptime(v, "%Y-%m-%d") if v else None


class FMPHistoricalDividendsFetcher(
    Fetcher[
        HistoricalDividendsQueryParams,
        HistoricalDividendsData,
        FMPHistoricalDividendsQueryParams,
        FMPHistoricalDividendsData,
    ]
):
    @staticmethod
    def transform_query(params: Dict[str, Any]) -> FMPHistoricalDividendsQueryParams:
        return FMPHistoricalDividendsQueryParams(**params)

    @staticmethod
    def extract_data(
        query: FMPHistoricalDividendsQueryParams, credentials: Optional[Dict[str, str]]
    ) -> List[FMPHistoricalDividendsData]:
        api_key = credentials.get("fmp_api_key") if credentials else ""

        url = create_url(
            3, f"historical-price-full/stock_dividend/{query.symbol}", api_key
        )
        return get_data_many(url, FMPHistoricalDividendsData, "historical")

    @staticmethod
    def transform_data(
        data: List[FMPHistoricalDividendsData],
    ) -> List[FMPHistoricalDividendsData]:
        return data
