export interface EvaluationContext {
  userId?: string;
  attributes?: Record<string, any>;
}

export interface EvaluationResult {
  enabled: boolean;
  key: string;
  variant?: string;
}
