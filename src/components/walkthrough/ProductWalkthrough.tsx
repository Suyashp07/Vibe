'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ProductWalkthrough() {
  const pathname = usePathname();

  useEffect(() => {
    // Only execute on home page
    if (pathname !== '/') return;

    var STEPS = [
      {
        icon: '👋',
        title: 'Welcome to Vibe',
        text: 'Find great events, join spontaneous meetups, or host your own in minutes.',
        points: [
          ['🔎', 'Discover events', 'Gigs, sports, comedy, tech and more'],
          ['⚡', 'Vibe Instant', 'Last-minute meetups happening now'],
          ['💬', 'Host in a chat', 'Create events from WhatsApp or Telegram'],
        ],
        cta: 'Start tour',
        skip: 'Maybe later',
      },
      {
        target: '#vt-instant',
        icon: '⚡',
        title: 'Meet Vibe Instant',
        text: "Plans that happen now, not weeks from now. See what’s going on around you and join in a tap.",
        pills: ['Happening now', 'Near you', 'Join in a tap'],
      },
      {
        target: '#vt-host',
        icon: '🎤',
        title: 'Host your own event',
        text: 'Create a full event page with details, tickets and a booking link, ready to share.',
      },
      {
        target: '#vt-bot-card',
        icon: '💬',
        title: 'Host from WhatsApp or Telegram',
        text: 'No forms and no dashboard. Message our bot and it sets up your event for you.',
      },
      {
        target: '#vt-bot-buttons',
        icon: '🤖',
        title: 'How the bot works',
        steps: [
          ['Open the chat', 'Tap WhatsApp or Telegram.'],
          ['Send your details', 'Name, date, place and price.'],
          ['Share your link', 'The bot publishes it and sends the link back.'],
        ],
      },
      {
        icon: '🎉',
        title: 'You’re all set',
        text: 'Explore events, try Vibe Instant, or message us to host yours. You can replay this tour anytime.',
        cta: 'Finish',
      },
    ];

    var KEY = 'vibe_walkthrough_hidden';
    var AUTO_START_DELAY = 800;

    var $ = function (id: string) {
      return document.getElementById(id);
    };

    var root = $('vtRoot');
    var hl = $('vtHl');
    var tip = $('vtTip');
    var never = $('vtNever') as HTMLInputElement | null;
    var i = 0;
    var lastFocus: HTMLElement | null = null;
    var token = 0;

    if (!root || !hl || !tip || !never) return;

    function store(get?: boolean, val?: string): string | null | void {
      try {
        if (typeof window === 'undefined') return null;
        return get
          ? localStorage.getItem(KEY)
          : val
          ? localStorage.setItem(KEY, val)
          : localStorage.removeItem(KEY);
      } catch {
        return null;
      }
    }

    var q = function (s?: string): HTMLElement | null {
      if (!s) return null;
      if (s === '#vt-instant') {
        var d = document.querySelector('#vt-instant') as HTMLElement | null;
        if (d && d.offsetParent !== null) return d;
        var m = document.querySelector('#vt-instant-mobile') as HTMLElement | null;
        if (m && m.offsetParent !== null) return m;
        return d || m;
      }
      if (s === '#vt-host') {
        var d = document.querySelector('#vt-host') as HTMLElement | null;
        if (d && d.offsetParent !== null) return d;
        var m = document.querySelector('#vt-host-mobile') as HTMLElement | null;
        if (m && m.offsetParent !== null) return m;
        return d || m;
      }
      return document.querySelector(s) as HTMLElement | null;
    };

    function fill(s: any) {
      if (!tip) return;
      var modal = !s.target;
      var last = i === STEPS.length - 1;
      tip.classList.toggle('vt-modal', modal);

      var heroIcon = $('vtHeroIcon');
      if (heroIcon) heroIcon.textContent = s.icon;

      var badge = $('vtBadge');
      if (badge) badge.textContent = s.icon;

      var count = $('vtCount');
      if (count) count.textContent = 'Step ' + i + ' of ' + (STEPS.length - 2);

      var title = $('vtTitle');
      if (title) title.textContent = s.title;

      var text = $('vtText');
      if (text) {
        text.textContent = s.text || '';
        text.hidden = !s.text;
      }

      var prog = $('vtProg');
      if (prog) prog.style.width = ((i + 1) / STEPS.length) * 100 + '%';

      var x = '';
      if (s.pills) {
        x =
          '<div class="vt-pills">' +
          s.pills
            .map(function (p: string) {
              return '<span>' + p + '</span>';
            })
            .join('') +
          '</div>';
      }
      if (s.points) {
        x =
          '<div class="vt-points">' +
          s.points
            .map(function (p: [string, string, string]) {
              return (
                '<div><em>' +
                p[0] +
                "</em><p style='margin:0'><b>" +
                p[1] +
                '</b><small>' +
                p[2] +
                '</small></p></div>'
              );
            })
            .join('') +
          '</div>';
      }
      if (s.steps) {
        x =
          '<div class="vt-steps">' +
          s.steps
            .map(function (p: [string, string], n: number) {
              return (
                '<div><strong>' +
                (n + 1) +
                "</strong><p style='margin:0'><b>" +
                p[0] +
                '</b><small>' +
                p[1] +
                '</small></p></div>'
              );
            })
            .join('') +
          '</div>';
      }

      var extra = $('vtExtra');
      if (extra) extra.innerHTML = x;

      var next = $('vtNext');
      if (next) next.textContent = s.cta || (last ? 'Finish' : 'Next');

      var back = $('vtBack');
      if (back) back.style.display = i === 0 || last ? 'none' : '';

      var skip = $('vtSkip');
      if (skip) {
        skip.textContent = s.skip || 'Skip tour';
        skip.style.display = last ? 'none' : '';
      }
    }

    function settle(done: () => void, t: number) {
      var prev = -1;
      var same = 0;
      var n = 0;
      function tick() {
        if (t !== token) return;
        var y = window.scrollY;
        same = y === prev ? same + 1 : 0;
        prev = y;
        if (same >= 3 || ++n > 70) {
          done();
        } else {
          requestAnimationFrame(tick);
        }
      }
      tick();
    }

    function place() {
      if (!root || !root.classList.contains('on') || !tip || !hl) return;
      var el = q(STEPS[i].target);
      var pad = 8;
      var m = 16;
      var tw = tip.offsetWidth;
      var th = tip.offsetHeight;

      hl.classList.toggle('vt-center', !el);

      if (!el) {
        hl.style.top = window.innerHeight / 2 + 'px';
        hl.style.left = window.innerWidth / 2 + 'px';
        hl.style.width = '0px';
        hl.style.height = '0px';
        if (window.innerWidth > 600) {
          tip.style.top = Math.max(m, (window.innerHeight - th) / 2) + 'px';
          tip.style.left = Math.max(m, (window.innerWidth - tw) / 2) + 'px';
        }
        return;
      }

      var r = el.getBoundingClientRect();
      hl.style.top = r.top - pad + 'px';
      hl.style.left = r.left - pad + 'px';
      hl.style.width = r.width + pad * 2 + 'px';
      hl.style.height = r.height + pad * 2 + 'px';

      var gap = 18;
      var below = true;
      var top = r.bottom + pad + gap;

      if (top + th > window.innerHeight - m) {
        below = false;
        top = r.top - pad - gap - th;
      }
      if (top < m) {
        top = Math.max(m, window.innerHeight - th - m);
      }

      var left = Math.min(Math.max(m, r.left + r.width / 2 - tw / 2), window.innerWidth - tw - m);
      tip.style.top = top + 'px';
      tip.style.left = left + 'px';

      var a = $('vtArrow');
      if (a) {
        a.className = 'vt-arrow ' + (below ? 'up' : 'down');
        a.style.left = Math.min(Math.max(22, r.left + r.width / 2 - left - 8), tw - 38) + 'px';
      }
    }

    function show(animate: boolean) {
      if (!root || !tip) return;
      var s = STEPS[i];
      var el = q(s.target);
      var t = ++token;
      var small = window.innerWidth <= 600;

      root.classList.toggle('vt-anim', !!animate);
      tip.classList.add('vt-hide');
      fill(s);

      if (el) {
        var r = el.getBoundingClientRect();
        var limit = small ? window.innerHeight * 0.5 : window.innerHeight - 24;
        if (r.top < 80 || r.bottom > limit) {
          var y = small
            ? r.top + window.scrollY - window.innerHeight * 0.18
            : r.top + window.scrollY - window.innerHeight / 2 + r.height / 2;
          window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
        }
      }

      settle(function () {
        if (!tip) return;
        place();
        tip.classList.remove('vt-hide');
        tip.classList.remove('vt-pop');
        void tip.offsetWidth;
        tip.classList.add('vt-pop');

        var next = $('vtNext');
        if (next) next.focus({ preventScroll: true });
      }, t);
    }

    function open() {
      if (!root || !never) return;
      i = 0;
      never.checked = false;
      lastFocus = document.activeElement as HTMLElement | null;
      root.classList.add('on');
      show(false);
    }

    function close() {
      token++;
      if (never && never.checked) store(false, '1');
      if (root) root.classList.remove('on');
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    function go(d: number) {
      var n = i + d;
      if (n < 0) return;
      if (n >= STEPS.length) return close();
      i = n;
      show(true);
    }

    var nextBtn = $('vtNext');
    if (nextBtn) nextBtn.onclick = function () { go(1); };

    var backBtn = $('vtBack');
    if (backBtn) backBtn.onclick = function () { go(-1); };

    var skipBtn = $('vtSkip');
    if (skipBtn) skipBtn.onclick = close;

    var xBtn = $('vtX');
    if (xBtn) xBtn.onclick = close;

    var onResize = function () {
      place();
    };
    var onScroll = function () {
      requestAnimationFrame(place);
    };
    var onKeyDown = function (e: KeyboardEvent) {
      if (!root || !root.classList.contains('on')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };

    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('keydown', onKeyDown);

    var force = /[?&]tour=1/.test(window.location.search);
    var timer: ReturnType<typeof setTimeout> | null = null;

    if (force || !store(true)) {
      timer = setTimeout(open, AUTO_START_DELAY);
    }

    return () => {
      if (timer) clearTimeout(timer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [pathname]);

  if (pathname !== '/') return null;

  return (
    <div
      className="vt-root"
      id="vtRoot"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vtTitle"
    >
      <div className="vt-hl" id="vtHl" />
      <div className="vt-tip" id="vtTip">
        <span className="vt-arrow" id="vtArrow" />
        <button className="vt-x" id="vtX" type="button" aria-label="Close tour">
          ×
        </button>
        <div className="vt-prog">
          <i id="vtProg" />
        </div>
        <div className="vt-hero">
          <span id="vtHeroIcon" />
        </div>
        <div className="vt-body">
          <div className="vt-head">
            <div className="vt-badge" id="vtBadge" />
            <div>
              <span className="vt-count" id="vtCount" />
              <h3 className="vt-title" id="vtTitle" />
            </div>
          </div>
          <p className="vt-text" id="vtText" />
          <div id="vtExtra" />
        </div>
        <div className="vt-foot">
          <label className="vt-never">
            <input type="checkbox" id="vtNever" /> Don’t show this again
          </label>
          <div className="vt-nav">
            <button className="vt-btn primary" id="vtNext" type="button">
              Next
            </button>
            <button className="vt-btn" id="vtBack" type="button">
              Back
            </button>
            <button className="vt-skip" id="vtSkip" type="button">
              Skip tour
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
