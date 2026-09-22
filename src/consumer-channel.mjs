/**
 * Minimal downstream consumer adapter.
 *
 * This intentionally consumes the live RPC shape without depending on Fiber's
 * internal Rust code. It demonstrates why the missing SDK declarations matter:
 * a downstream application can safely read the fields only after its contract
 * surface is updated and tested against a real response.
 */
export function summarizeChannel(channel) {
  if (!channel || typeof channel !== 'object') throw new TypeError('channel must be an object');
  for (const key of ['channel_id', 'state', 'is_acceptor', 'is_one_way', 'pending_tlcs', 'failure_detail']) {
    if (!(key in channel)) throw new Error(`missing channel field: ${key}`);
  }
  return {
    channelId: channel.channel_id,
    state: channel.state?.state_name ?? 'unknown',
    role: channel.is_acceptor ? 'acceptor' : 'initiator',
    direction: channel.is_one_way ? 'one-way' : 'two-way',
    pendingTlcCount: Array.isArray(channel.pending_tlcs) ? channel.pending_tlcs.length : null,
    failureDetail: channel.failure_detail ?? null
  };
}
