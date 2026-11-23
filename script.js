/* RAGE ROOM 404 — поведение страницы. Без зависимостей. */

/**
 * Настройка отправки заявки.
 * whatsapp — номер в международном формате без «+» и пробелов, например "77001234567".
 * Пока поле пустое, форма работает в демо-режиме и ничего не отправляет.
 */
const BOOKING_CONFIG = {
  whatsapp: '', // [WHATSAPP]
};

(() => {
  const doc = document.documentElement;
  doc.classList.add('js');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.header');
  const burger = document.querySelector('.burger');
  const nav = document.getElementById('nav');
  const dock = document.querySelector('.dock');

  /* ---------- Header: фон при скролле ---------- */
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Мобильное меню ---------- */
  const setMenu = (open) => {
    header.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
    document.body.classList.toggle('no-scroll', open);
  };
  burger.addEventListener('click', () => setMenu(!header.classList.contains('is-open')));
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && header.classList.contains('is-open')) { setMenu(false); burger.focus(); }
  });
  window.matchMedia('(min-width: 960px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });

  /* ---------- Глитч «404» — один раз при загрузке ---------- */
  const glitch = document.querySelector('.glitch');
  if (glitch && !reduceMotion) {
    setTimeout(() => glitch.classList.add('is-glitching'), 700);
  }

  /* ---------- Появление блоков ---------- */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Беззвучные петли в галерее: играют только на экране ---------- */
  const loops = document.querySelectorAll('video.loop');
  if (loops.length && 'IntersectionObserver' in window && !reduceMotion) {
    const vio = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) { target.play().catch(() => {}); } else { target.pause(); }
      });
    }, { threshold: 0.35 });
    loops.forEach((v) => vio.observe(v));
  }

  /* ---------- Видео сеанса: само запускается (без звука), когда доходит до экрана ---------- */
  const session = document.querySelector('#video video');
  const soundBtn = document.querySelector('.video__sound');
  if (session) {
    let pausedByUser = false;
    let autoPause = false;

    session.addEventListener('pause', () => {
      if (!autoPause && !session.ended) pausedByUser = true;
      autoPause = false;
    });
    session.addEventListener('play', () => { pausedByUser = false; });

    if ('IntersectionObserver' in window && !reduceMotion) {
      new IntersectionObserver(([en]) => {
        if (en.isIntersecting && session.paused && !pausedByUser) {
          session.muted = session.muted || soundBtn.getAttribute('aria-pressed') !== 'true';
          session.play().catch(() => {});
        } else if (!en.isIntersecting && !session.paused) {
          autoPause = true;
          session.pause();
        }
      }, { threshold: 0.5 }).observe(session);
    }

    const syncSound = () => {
      const on = !session.muted;
      soundBtn.setAttribute('aria-pressed', String(on));
      soundBtn.querySelector('span').textContent = on ? 'Выключить звук' : 'Включить звук';
    };
    soundBtn.addEventListener('click', () => {
      session.muted = !session.muted;
      if (!session.muted && session.paused) session.play().catch(() => {});
      syncSound();
    });
    session.addEventListener('volumechange', syncSound);
  }

  /* ---------- Видеоотзывы: большая кнопка «пуск» по центру ---------- */
  document.querySelectorAll('.vreview').forEach((card) => {
    const video = card.querySelector('video');
    const btn = card.querySelector('.vplay');
    btn.addEventListener('click', () => {
      video.controls = true; // после первого запуска — обычная панель управления
      video.play().catch(() => {});
    });
    video.addEventListener('play', () => card.classList.add('is-playing'));
    video.addEventListener('pause', () => card.classList.remove('is-playing'));
    video.addEventListener('ended', () => card.classList.remove('is-playing'));
  });

  /* ---------- Видео со звуком: одновременно играет только одно ---------- */
  const players = document.querySelectorAll('video:not(.loop)');
  players.forEach((v) => v.addEventListener('play', () => {
    players.forEach((other) => { if (other !== v) other.pause(); });
  }));

  /* ---------- Мобильная плашка «Забронировать» ---------- */
  if (dock && 'IntersectionObserver' in window) {
    const hero = document.querySelector('.hero');
    const booking = document.getElementById('booking');
    let heroVisible = true;
    let bookingVisible = false;
    const dockLink = dock.querySelector('a');
    const update = () => {
      const show = !heroVisible && !bookingVisible;
      dock.classList.toggle('is-visible', show);
      dock.setAttribute('aria-hidden', String(!show));
      dockLink.tabIndex = show ? 0 : -1;
    };
    new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; update(); }, { threshold: 0.15 }).observe(hero);
    new IntersectionObserver(([en]) => { bookingVisible = en.isIntersecting; update(); }, { threshold: 0.05 }).observe(booking);
  }

  /* ---------- Тарифы: данные берутся из карточек (data-tariff, data-price, data-guests) ---------- */
  const tariffSelect = document.getElementById('f-tariff');
  const guestsSelect = document.getElementById('f-guests');
  const fmt = (n) => n.toLocaleString('ru-RU');
  const guestWord = (n) => (n === 1 ? 'гость' : n < 5 ? 'гостя' : 'гостей');
  const tariffs = [...document.querySelectorAll('.price[data-tariff]')].map((el) => ({
    el,
    name: el.dataset.tariff,
    price: Number(el.dataset.price),
    max: Number(el.dataset.guests),
  }));

  // строка «от N ₸ с человека» в карточках, где можно прийти вдвоём и больше
  tariffs.forEach((t) => {
    if (t.max < 2) return;
    const line = document.createElement('p');
    line.className = 'price__split';
    line.innerHTML = `от <b>${fmt(Math.ceil(t.price / t.max))} ₸</b> с человека, если вас ${t.max}`;
    t.el.querySelector('.price__value').after(line);
  });

  const fillForm = (name, guests) => {
    tariffSelect.value = name;
    if (guests) guestsSelect.value = String(guests);
  };
  document.querySelectorAll('[data-pick]').forEach((btn) => {
    btn.addEventListener('click', () => fillForm(btn.dataset.pick));
  });

  /* ---------- Калькулятор деления цены ---------- */
  const calcTariff = document.getElementById('calc-tariff');
  const calcGuests = document.getElementById('calc-guests');
  if (calcTariff && tariffs.length) {
    const perOut = document.getElementById('calc-per');
    const totalOut = document.getElementById('calc-total');
    const calcBook = document.getElementById('calc-book');
    let guests = 3;

    calcTariff.innerHTML = tariffs
      .map((t, i) => `<option value="${i}">${t.name}</option>`)
      .join('');
    calcTariff.value = String(Math.max(0, tariffs.findIndex((t) => t.name === 'Последняя капля')));

    const render = () => {
      const t = tariffs[Number(calcTariff.value)];
      guests = Math.min(Math.max(guests, 1), t.max);
      calcGuests.innerHTML = Array.from({ length: 5 }, (_, i) => {
        const n = i + 1;
        const off = n > t.max;
        return `<label class="seg__item${off ? ' is-off' : ''}">
          <input type="radio" name="calc-guests" value="${n}" ${n === guests ? 'checked' : ''} ${off ? 'disabled' : ''}>
          <span>${n}</span></label>`;
      }).join('');
      perOut.textContent = fmt(Math.ceil(t.price / guests));
      totalOut.textContent = `${fmt(t.price)} ₸ за сеанс · ${guests} ${guestWord(guests)}`
        + (t.max < 5 ? ` · в этом тарифе до ${t.max}` : '');
    };

    calcTariff.addEventListener('change', render);
    calcGuests.addEventListener('change', (e) => {
      if (e.target.name === 'calc-guests') { guests = Number(e.target.value); render(); }
    });
    calcBook.addEventListener('click', () => fillForm(tariffs[Number(calcTariff.value)].name, guests));
    render();
  }

  /* ---------- Дата: не раньше сегодняшней ---------- */
  const dateInput = document.getElementById('f-date');
  const today = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  dateInput.min = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  /* ---------- Форма бронирования ---------- */
  const form = document.getElementById('booking-form');
  const status = form.querySelector('.form__status');

  const validate = () => {
    let firstBad = null;
    form.querySelectorAll('[required]').forEach((input) => {
      let ok = input.value.trim() !== '';
      if (input.type === 'tel') ok = input.value.replace(/\D/g, '').length >= 10;
      input.closest('.field').classList.toggle('is-invalid', !ok);
      input.setAttribute('aria-invalid', String(!ok));
      if (!ok && !firstBad) firstBad = input;
    });
    return firstBad;
  };

  form.addEventListener('input', (e) => {
    const field = e.target.closest('.field');
    if (field && field.classList.contains('is-invalid')) validate();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    status.className = 'form__status';
    const bad = validate();
    if (bad) {
      status.textContent = 'Заполни имя, телефон и дату — и мы свяжемся.';
      status.classList.add('is-err');
      bad.focus();
      return;
    }

    const d = Object.fromEntries(new FormData(form));
    const text = [
      'Заявка RAGE ROOM 404',
      `Имя: ${d.name}`,
      `Телефон: ${d.phone}`,
      `Дата: ${d.date}${d.time ? `, ${d.time}` : ''}`,
      d.tariff ? `Тариф: ${d.tariff}` : '',
      `Гостей: ${d.guests}`,
      d.comment ? `Комментарий: ${d.comment}` : '',
    ].filter(Boolean).join('\n');

    if (BOOKING_CONFIG.whatsapp) {
      window.open(`https://wa.me/${BOOKING_CONFIG.whatsapp}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
      status.textContent = 'Открываем WhatsApp — отправь сообщение, и администратор подтвердит время.';
      status.classList.add('is-ok');
      form.reset();
    } else {
      status.textContent = 'Демо-режим: заявка собрана, но отправка ещё не подключена (укажите WhatsApp в script.js).';
      status.classList.add('is-ok');
      console.info(text);
    }
  });
})();
