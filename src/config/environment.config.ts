export interface EnvironmentConfig {
  port: number;
  nodeEnv: string;
  isProduction: boolean;
  isDevelopment: boolean;
  isTest: boolean;
}

export const environmentConfig = (): EnvironmentConfig => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  return {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv,
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',
    isTest: nodeEnv === 'test',
  };
};
