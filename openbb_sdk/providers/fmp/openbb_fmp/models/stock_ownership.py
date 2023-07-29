"""FMP Stock Ownership fetcher."""


from typing import Any, Dict, List, Optional

from openbb_provider.abstract.fetcher import Fetcher
from openbb_provider.models.stock_ownership import (
    StockOwnershipData,
    StockOwnershipQueryParams,
)

from openbb_fmp.utils.helpers import create_url, get_data_many


class FMPStockOwnershipQueryParams(StockOwnershipQueryParams):
    """FMP Stock Ownership query.

    Source: https://site.financialmodelingprep.com/developer/docs/#Stock-Ownership-by-Holders

    Parameter
    ---------
    symbol : string
        The symbol of the company.
    page : int
        The page number to get
    date : date
        The CIK of the company owner.
    """


class FMPStockOwnershipData(StockOwnershipData):
    """FMP Stock Ownership data."""


class FMPStockOwnershipFetcher(
    Fetcher[
        StockOwnershipQueryParams,
        StockOwnershipData,
        FMPStockOwnershipQueryParams,
        FMPStockOwnershipData,
    ]
):
    @staticmethod
    def transform_query(params: Dict[str, Any]) -> FMPStockOwnershipQueryParams:
        return FMPStockOwnershipQueryParams(**params)

    @staticmethod
    def extract_data(
        query: FMPStockOwnershipQueryParams, credentials: Optional[Dict[str, str]]
    ) -> List[FMPStockOwnershipData]:
        api_key = credentials.get("fmp_api_key") if credentials else ""

        url = create_url(
            4,
            "institutional-ownership/institutional-holders/symbol-ownership-percent",
            api_key,
            query,
        )
        return get_data_many(url, FMPStockOwnershipData)

    @staticmethod
    def transform_data(
        data: List[FMPStockOwnershipData],
    ) -> List[FMPStockOwnershipData]:
        return data
