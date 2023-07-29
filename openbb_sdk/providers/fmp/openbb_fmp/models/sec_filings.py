"""SEC Filings fetcher."""


from datetime import (
    date as dateType,
    datetime,
)
from typing import Any, Dict, List, Optional

from openbb_provider.abstract.data import Data
from openbb_provider.abstract.fetcher import Fetcher
from openbb_provider.models.sec_filings import SECFilingsData, SECFilingsQueryParams
from pydantic import validator

from openbb_fmp.utils.helpers import create_url, get_data_many


class FMPSECFilingsQueryParams(SECFilingsQueryParams):
    """FMP SEC Filings QueryParams.

    Source: https://site.financialmodelingprep.com/developer/docs/sec-filings-api/

    Parameter
    ---------
    symbol : str
        The symbol of the company.
    type : str
        The type of the SEC filing form. (full list: https://www.sec.gov/forms)
    page : int
        The page of the results.
    limit : int
        The limit of the results.
    """


class FMPSECFilingsData(Data):
    symbol: str
    fillingDate: dateType
    acceptedDate: dateType
    cik: str
    type: str
    link: str
    finalLink: str

    @validator("fillingDate", "acceptedDate", pre=True)
    def convert_date(cls, v):  # pylint: disable=no-self-argument
        return datetime.strptime(v, "%Y-%m-%d %H:%M:%S").date()


class FMPSECFilingsFetcher(
    Fetcher[
        SECFilingsQueryParams,
        SECFilingsData,
        FMPSECFilingsQueryParams,
        FMPSECFilingsData,
    ]
):
    @staticmethod
    def transform_query(params: Dict[str, Any]) -> FMPSECFilingsQueryParams:
        return FMPSECFilingsQueryParams(**params)

    @staticmethod
    def extract_data(
        query: FMPSECFilingsQueryParams, credentials: Optional[Dict[str, str]]
    ) -> List[FMPSECFilingsData]:
        api_key = credentials.get("fmp_api_key") if credentials else ""

        url = create_url(
            3, f"sec_filings/{query.symbol}", api_key, query, exclude=["symbol"]
        )
        return get_data_many(url, FMPSECFilingsData)

    @staticmethod
    def transform_data(data: List[FMPSECFilingsData]) -> List[FMPSECFilingsData]:
        return data
