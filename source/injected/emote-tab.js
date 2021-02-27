/* Added by Jabster28 | MIT Licensed */
/* Modified by UniQMG */
(async () => {
  let user = localStorage.userID
    ? (await (await fetch(`/api/users/${localStorage.userID}`, {
        headers: new Headers({
          Authorization: 'Bearer ' + localStorage.userToken,
        }),
      })).json()).user
    : { supporter: false, verified: false, staff: false };

  while (!window.emoteMap)
    await new Promise(res => setTimeout(res, 100));

  const emotes = window.emoteMap;
  const emoteList = [];

  function add(emotes, allowed) {
    for (let key of Object.keys(emotes))
      emoteList.push({ name: key, url: emotes[key], allowed });
  }
  add(emotes.base, true);
  add(emotes.supporter, user.supporter);
  add(emotes.verified, user.verified);
  add(emotes.staff, user.role == 'admin');

  const chat = document.getElementById('room_chat');
  const ingamechat = document.getElementById('ingame_chat');
  const chatbox = document.getElementById('chat_input');
  const ingamechatbox = document.getElementById('ingame_chat_input');

  const picker = document.createElement('div');
  picker.classList.add('tetrioplus-emote-picker');
  picker.classList.add('chat-message');
  for (let { name, url, allowed } of emoteList) {
    let img = document.createElement('img');
    img.classList.toggle('disallowed', !allowed);
    picker.appendChild(img);
    if (allowed) {
      img.addEventListener('click', () => {
        if (picker.parentElement == ingamechat) {
          ingamechatbox.value += `:${name}:`;
        } else {
          chatbox.value += `:${name}:`;
        }
      });
    }
    img.src = '/res/' + url;
  }

  chatbox.addEventListener('keydown', evt => {
    if (evt.key != 'Tab') return;
    evt.preventDefault();
    if (picker.parentElement != chat) {
      chat.appendChild(picker);
      picker.classList.toggle('visible', true);
    } else {
      picker.classList.toggle('visible');
    }
  });
  ingamechatbox.addEventListener('keydown', evt => {
    if (evt.key != 'Tab') return;
    evt.preventDefault();
    if (picker.parentElement != ingamechat) {
      ingamechat.appendChild(picker);
      picker.classList.toggle('visible', true);
    } else {
      picker.classList.toggle('visible');
    }
  });
})()
