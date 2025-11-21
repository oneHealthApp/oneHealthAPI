import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

export async function getDatabaseUrl() {
  const client = new SecretsManagerClient({ region: 'eu-north-1' });

  // 1. Validate secret ARN
  const secretId = process.env.RDS_SECRET_ARN;
  console.log('secret', secretId);
  if (!secretId) {
    throw new Error('❌ RDS_SECRET_ARN is missing in environment variables');
  }

  // 2. Fetch the secret
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretId }),
  );

  // 3. Ensure SecretString exists
  if (!response.SecretString) {
    throw new Error(
      '❌ SecretString is missing from AWS Secrets Manager response',
    );
  }

  // 4. Parse the secret JSON
  const secret = JSON.parse(response.SecretString);

  const dbname = secret.dbname || 'postgres';
  console.log('dbname', dbname);
  // 5. Build and return the PostgreSQL connection URL
  return `postgresql://${secret.username}:${secret.password}@${secret.host}:${secret.port}/${dbname}?schema=public`;
}
