export const useAdminDashboard = (accounts: string[], domains: string[]) => {
  const byDomain = domains.map(domain => ({
    domain,
    count: accounts.filter(a => a.endsWith(`@${domain}`)).length,
  }))

  const recent = [...accounts].reverse().slice(0, 8)

  return { byDomain, recent }
}
