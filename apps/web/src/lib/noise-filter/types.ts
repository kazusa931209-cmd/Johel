export interface NoiseFilterDiagnostic {
  filter: string;
  beforeLength: number;
  afterLength: number;
  removedLength: number;
}

export interface NoiseFilterContext {
  source: string;
  text: string;
  metadata: {
    originalLength: number;
    currentLength: number;
  };
  diagnostics: NoiseFilterDiagnostic[];
}

export interface NoiseFilter {
  name: string;
  apply(context: NoiseFilterContext): NoiseFilterContext;
}

export interface NoiseFilterResult {
  text: string;
  originalLength: number;
  currentLength: number;
  reductionRate: number;
  diagnostics: NoiseFilterDiagnostic[];
}
