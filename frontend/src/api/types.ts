export type FindingMethod = 'heuristic' | 'embeddings';

export type NormalizeOptions = {
  enable_embeddings: boolean;
};

export type NormalizeRequest = {
  text: string;
  options?: Partial<NormalizeOptions>;
};

export type Evidence = {
  quote: string;
  start: number;
  end: number;
};

export type Finding = {
  symptom: string;
  score: number;
  negated: boolean;
  method: FindingMethod;
  evidence: Evidence[];
};

export type DomainResult = {
  domain_id: string;
  domain_name: string;
  findings: Finding[];
};

export type Gap = {
  domain_id: string;
  domain_name: string;
  gap_level: 'none' | 'low' | 'medium' | 'high';
  rationale: string;
  suggested_questions: string[];
};

export type Summary = {
  text: string | null;
  generated_by: 'none' | 'template' | 'llm';
};

export type WarningItem = {
  code: string;
  message: string;
};

export type NormalizeResponse = {
  request_id: string;
  created_at: string;
  ontology: { version: string; source: string };
  input: { text_length: number; was_anonymized: boolean; redacted_text?: string | null };
  domains: DomainResult[];
  gaps: Gap[];
  summary: Summary;
  warnings: WarningItem[];
};

export type HistoryItem = {
  request_id: string;
  created_at: string;
  text_length: number;
  findings_count: number;
  gaps_count: number;
};
