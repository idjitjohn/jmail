import { textSetting } from '@/lib/text-setting'

const handlers = textSetting('signature', 10000)
export const GET = handlers.GET
export const POST = handlers.POST
