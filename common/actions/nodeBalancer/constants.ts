export enum TypeKeys {
  NODE_ONLINE = 'NODE_ONLINE',
  NODE_OFFLINE = 'NODE_OFFLINE',
  NODE_ADDED = 'NODE_ADDED',
  NODE_REMOVED = 'NODE_REMOVED',

  WORKER_PROCESSING = 'WORKER_PROCESSING',
  WORKER_SPAWNED = 'WORKER_SPAWNED',
  WORKER_KILLED = 'WORKER_KILLED',

  BALANCER_FLUSH = 'BALANCER_FLUSH',
  BALANCER_AUTO = 'BALANCER_AUTO',
  BALANCER_MANUAL = 'BALANCER_MANUAL',

  NODE_CALL_REQUESTED = 'NODE_CALL_REQUESTED',
  NODE_CALL_TIMEOUT = 'NODE_CALL_TIMEOUT',
  NODE_CALL_SUCCEEDED = 'NODE_CALL_SUCCEEDED',
  NODE_CALL_FAILED = 'NODE_CALL_FAILED',

  BALANCER_NETWORK_SWTICH_REQUESTED = 'BALANCER_NETWORK_SWTICH_REQUESTED',
  BALANCER_NETWORK_SWITCH_SUCCEEDED = 'BALANCER_NETWORK_SWITCH_SUCCEEDED'
}