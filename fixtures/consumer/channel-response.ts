// Consumer-side contract fixture. This is the proposed type surface that a
// downstream SDK/application needs for the observed RPC response.
export interface FiberChannelContractFixture {
  channel_id: string;
  state: { state_name: string; state_flags?: string };
  is_acceptor: boolean;
  is_one_way: boolean;
  pending_tlcs: unknown[];
  failure_detail: string | null;
}

export function readChannel(channel: FiberChannelContractFixture) {
  return {
    id: channel.channel_id,
    state: channel.state.state_name,
    role: channel.is_acceptor ? 'acceptor' : 'initiator',
    pendingTlcs: channel.pending_tlcs.length,
    failure: channel.failure_detail
  };
}
