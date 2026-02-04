import { fromBase64 } from '@mysten/bcs';
import { verifyPersonalMessageSignature } from '@mysten/sui/verify';
import { SuiGraphQLClient } from '@mysten/sui/graphql';

// GraphQL client for ZkLogin verification
// Default to testnet since frontend uses testnet
const graphqlClient = new SuiGraphQLClient({
  url: process.env.SUI_GRAPHQL_URL || 'https://graphql.testnet.sui.io/graphql',
});

export async function verifyWalletSignature(
  address: string,
  signature: string,
  signedMessageBytes: string,
): Promise<boolean> {
  try {
    // Use the actual message bytes that were signed by the wallet
    const message = fromBase64(signedMessageBytes);

    // Check if it's a ZkLogin signature (starts with 'BQNN' or first char is 'B')
    const isZkLogin = signature.startsWith('BQNN') || signature[0] === 'B';

    if (isZkLogin) {
      await verifyPersonalMessageSignature(message, signature, {
        address,
        client: graphqlClient,
      });
    } else {
      await verifyPersonalMessageSignature(message, signature, {
        address,
      });
    }

    return true;
  } catch {
    return false;
  }
}
