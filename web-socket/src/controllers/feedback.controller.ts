import { bot } from '../bot';
import { Config } from '../config';
import { RoutePayload } from '../models';
import { usersRepo } from '../mongo';

export class FeedbackController {
  static send({ payload: { subject, message }, userId, send }: RoutePayload<'feedback'>) {
    const { chatId } = Config.telegram;
    if (!chatId) throw new Error('Chat id not provided');
    bot?.telegram
      .sendMessage(chatId, `<b>${subject}</b>\nОт: <b>${usersRepo.get(userId)?.name}</b>\n${message}`, { parse_mode: 'HTML' })
      .then(() => send('feedback', { success: true }))
      .catch(() => send('feedback', { success: false }));
  }
}
