const BASE_URL = 'https://www.data.gov.bh/api/explore/v2.1';

/**
 * Fetches records from a specific dataset on data.gov.bh.
 * Supports standard Opendatasoft ODSQL parameters.
 * 
 * @param {string} datasetId - The ID of the dataset to query
 * @param {object} params - Query parameters (e.g. limit, select, order_by, where)
 * @returns {Promise<object>} The raw response JSON
 */
export async function fetchDatasetRecords(datasetId, params = {}) {
  const queryParams = new URLSearchParams({
    limit: 40,
    ...params
  });
  
  const url = `${BASE_URL}/catalog/datasets/${datasetId}/records?${queryParams.toString()}`;
  
  const response = await fetch(url, {
    method: 'GET'
  });
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`OpenData error (${response.status}): ${errorText.slice(0, 100)}`);
  }
  
  return await response.json();
}
