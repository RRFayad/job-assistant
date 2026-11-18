// ---------- Environment ----------

type GetEnvVar = {
  (name: string): string;
  (name: string, throwErr: true): string;
  (name: string, throwErr: false): string | undefined;
};

export const getEnvVar = ((
  name: string,
  throwErr = true,
): string | undefined => {
  const value = process.env[name];

  if (!value) {
    if (throwErr) {
      throw new Error(`${name} environment variable is not set`);
    }

    return undefined;
  }

  return value;
}) as GetEnvVar;
