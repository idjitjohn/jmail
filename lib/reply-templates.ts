export type ReplyTemplate = {
  id: string
  name: string
  body: string
}

export const starterTemplates: ReplyTemplate[] = [
  {
    id: 'thanks',
    name: 'A quick thank you',
    body: 'Thanks for sending this over! I appreciate your help and will take a look shortly.',
  },
  {
    id: 'follow-up',
    name: 'A friendly follow-up',
    body: 'Just checking in on my last message. When you have a moment, I’d love to hear your thoughts. Thanks!',
  },
  {
    id: 'received',
    name: 'Received, thank you',
    body: 'Thanks for reaching out! I’ve received your message and will get back to you as soon as I can.',
  },
]

export const templateToHtml = (body: string) =>
  body
    .split('\n')
    .map(
      (line) =>
        `<p>${line.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;') || '<br>'}</p>`,
    )
    .join('')
