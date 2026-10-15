-- Notes take reactions only: private replies were removed from the site and the tool (PR #81).
-- Drop what was left of them: the function visitors called, the table (empty) and the reply rate rows.

drop function if exists public.submit_note_reply(int, text, text, text, text, text);
drop table if exists public.note_replies;

delete from private.note_rate where action = 'reply';
alter table private.note_rate drop constraint if exists note_rate_action_check;
alter table private.note_rate add constraint note_rate_action_check check (action = 'react');
