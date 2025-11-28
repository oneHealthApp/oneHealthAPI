import { MasterDataKey, MasterDataValue } from './master.data';

export interface MasterDataRequest {
  collection: MasterDataKey;
}

export interface MasterDataResponse {
  success: boolean;
  message: string;
  data: {
    collection: string;
    items: MasterDataValue;
    count: number;
  };
}

export interface MasterDataListResponse {
  success: boolean;
  message: string;
  data: {
    collections: string[];
    count: number;
  };
}

export interface SearchMasterDataRequest {
  collection: MasterDataKey;
  searchTerm: string;
}

export interface MasterDataItem {
  value: string;
  label: string;
  [key: string]: any;
}

export interface DiseaseItem extends MasterDataItem {
  snomedId: string;
  icdCode: string;
  diseaseType: string;
  metadata: {
    commonSymptoms: string[];
  };
}

export interface SimpleItem extends MasterDataItem {
  value: string;
  label: string;
}