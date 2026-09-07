export type Domain = {
  name: string
  mxHost: string
  ipv4: string
  ipv6: string
  selector: string
  dkimRecord?: string
}

export type Forwarding = {
  source: string
  destination: string
  keepCopy: boolean
}

export type ServerState = {
  domains: Domain[]
  forwarding: Forwarding[]
  revision: string
  primaryDomain: string
  active: boolean
  forwardingReady: boolean
}

export type Change = {
  kind: 'domain' | 'forwarding'
  original?: string
  domain?: Domain
  source?: string
  destination?: string
  keepCopy?: boolean
  revision: string
}

export type Check = {
  name: string
  status: 'pass' | 'fail' | 'warning'
  detail: string
  expected?: string
}

export type DiagnosticResult = {
  checks: Check[]
  token?: string
  messageId?: string
}
