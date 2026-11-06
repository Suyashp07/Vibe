'use client';

import React, { useState, useEffect, useRef } from 'react';

type DemoMode = 'type' | 'poster';

interface ChatMessage {
  type: 'user-text' | 'user-poster' | 'bot-typing' | 'bot-text' | 'bot-card';
  text?: string;
  tag?: string;
  title?: string;
  venue?: string;
  price?: string;
  card?: {
    title: string;
    isLive: boolean;
    when: string;
    where: string;
    entry: string;
    link: string;
  };
}

export default function BotCreateSection() {
  const [mode, setMode] = useState<DemoMode>('type');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const timersRef = useRef<NodeJS.Timeout[]>([]);

  const clearTimers = () => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  };

  useEffect(() => {
    // If reduced motion is requested, show final state
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (mode === 'type') {
        setMessages([
          { type: 'user-text', text: 'Open Mic Night, 15 Nov, Cafe Brew Indore' },
          {
            type: 'bot-card',
            card: {
              title: 'Open Mic Night',
              isLive: true,
              when: '15 Nov, 7:00 PM',
              where: 'Cafe Brew, Indore',
              entry: 'Free',
              link: 'vibe.swaniki.com/e/open-mic-night',
            },
          },
          { type: 'bot-text', text: 'Your event is live. Share the link with your guests.' },
        ]);
      } else {
        setMessages([
          {
            type: 'user-poster',
            tag: 'LIVE MUSIC',
            title: 'Sunset Beats',
            venue: '22 Nov · Sky Deck, Pune',
            price: '₹499',
          },
          {
            type: 'bot-card',
            card: {
              title: 'Sunset Beats',
              isLive: true,
              when: '22 Nov, 6:30 PM',
              where: 'Sky Deck, Pune',
              entry: '₹499',
              link: 'vibe.swaniki.com/e/sunset-beats',
            },
          },
          { type: 'bot-text', text: 'I filled in the details from your poster. Reply to edit anything.' },
        ]);
      }
      return;
    }

    const runLoop = () => {
      clearTimers();
      setMessages([]);

      if (mode === 'type') {
        const t1 = setTimeout(() => {
          setMessages([{ type: 'user-text', text: 'Open Mic Night, 15 Nov, Cafe Brew Indore' }]);
        }, 100);

        const t2 = setTimeout(() => {
          setMessages((prev) => [...prev, { type: 'bot-typing' }]);
        }, 800);

        const t3 = setTimeout(() => {
          setMessages((prev) => [
            ...prev.filter((m) => m.type !== 'bot-typing'),
            { type: 'bot-text', text: 'Got it. Creating your event…' },
          ]);
        }, 1900);

        const t4 = setTimeout(() => {
          setMessages((prev) => [...prev, { type: 'bot-typing' }]);
        }, 2700);

        const t5 = setTimeout(() => {
          setMessages((prev) => [
            ...prev.filter((m) => m.type !== 'bot-typing'),
            {
              type: 'bot-card',
              card: {
                title: 'Open Mic Night',
                isLive: true,
                when: '15 Nov, 7:00 PM',
                where: 'Cafe Brew, Indore',
                entry: 'Free',
                link: 'vibe.swaniki.com/e/open-mic-night',
              },
            },
          ]);
        }, 3800);

        const t6 = setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { type: 'bot-text', text: 'Your event is live. Share the link with your guests.' },
          ]);
        }, 4800);

        const t7 = setTimeout(() => {
          runLoop();
        }, 9000);

        timersRef.current = [t1, t2, t3, t4, t5, t6, t7];
      } else {
        const t1 = setTimeout(() => {
          setMessages([
            {
              type: 'user-poster',
              tag: 'LIVE MUSIC',
              title: 'Sunset Beats',
              venue: '22 Nov · Sky Deck, Pune',
              price: '₹499',
            },
          ]);
        }, 100);

        const t2 = setTimeout(() => {
          setMessages((prev) => [...prev, { type: 'bot-typing' }]);
        }, 900);

        const t3 = setTimeout(() => {
          setMessages((prev) => [
            ...prev.filter((m) => m.type !== 'bot-typing'),
            { type: 'bot-text', text: 'Reading your poster…' },
          ]);
        }, 2000);

        const t4 = setTimeout(() => {
          setMessages((prev) => [...prev, { type: 'bot-typing' }]);
        }, 2800);

        const t5 = setTimeout(() => {
          setMessages((prev) => [
            ...prev.filter((m) => m.type !== 'bot-typing'),
            {
              type: 'bot-card',
              card: {
                title: 'Sunset Beats',
                isLive: true,
                when: '22 Nov, 6:30 PM',
                where: 'Sky Deck, Pune',
                entry: '₹499',
                link: 'vibe.swaniki.com/e/sunset-beats',
              },
            },
          ]);
        }, 3900);

        const t6 = setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            { type: 'bot-text', text: 'I filled in the details from your poster. Reply to edit anything.' },
          ]);
        }, 4900);

        const t7 = setTimeout(() => {
          runLoop();
        }, 9200);

        timersRef.current = [t1, t2, t3, t4, t5, t6, t7];
      }
    };

    runLoop();

    return () => {
      clearTimers();
    };
  }, [mode]);

  return (
    <section id="vt-bot-card" className="bot-create-section" aria-label="Create event via messaging bot">
      <div className="bot-create-container">
        {/* Left Column: Heading, 3-Step Guide, Action Buttons */}
        <div className="bot-create-left">
          <h2
            className="bot-create-h1"
            style={{ textTransform: 'none', lineHeight: 1.15 }}
          >
            Create an event as easily as sending a text.
          </h2>
          <p className="bot-create-subtext">
            No forms and no app to install. Message our bot on{' '}
            <strong className="text-[#128C7E] dark:text-[#25D366] font-bold">WhatsApp</strong> or{' '}
            <strong className="text-[#229ED9] dark:text-[#38bdf8] font-bold">Telegram</strong> and your event goes live in seconds.
          </p>

          <div className="bot-steps-list">
            {/* Step 1 */}
            <div className="bot-step-item">
              <div className="bot-step-indicator">
                <div className="bot-step-circle">1</div>
                <div className="bot-step-line" aria-hidden="true" />
              </div>
              <div className="bot-step-content">
                <h3 className="bot-step-title" style={{ textTransform: 'none' }}>
                  Send the basics or a poster
                </h3>
                <p className="bot-step-desc">
                  Type <code className="bot-code-chip">Open Mic Night, 15 Nov, Cafe Brew</code> or just share your flyer.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bot-step-item">
              <div className="bot-step-indicator">
                <div className="bot-step-circle">2</div>
                <div className="bot-step-line" aria-hidden="true" />
              </div>
              <div className="bot-step-content">
                <h3 className="bot-step-title" style={{ textTransform: 'none' }}>
                  The bot builds your event
                </h3>
                <p className="bot-step-desc">
                  It reads the name, date, venue and price, then shows you a preview.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bot-step-item">
              <div className="bot-step-indicator">
                <div className="bot-step-circle">3</div>
              </div>
              <div className="bot-step-content">
                <h3 className="bot-step-title" style={{ textTransform: 'none' }}>
                  Share your event link
                </h3>
                <p className="bot-step-desc">
                  Guests can RSVP right away, and you manage everything from your host dashboard.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div id="vt-bot-buttons" className="bot-action-buttons">
            <a
              href="https://wa.me/919183123093?text=Vibe%2FEvents"
              target="_blank"
              rel="noopener noreferrer"
              className="bot-btn bot-btn-whatsapp"
            >
              <svg className="bot-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.93.52 3.8 1.5 5.44L2.2 22l4.82-1.39a9.88 9.88 0 0 0 5.02 1.34h.01c5.46 0 9.91-4.45 9.91-9.91A9.91 9.91 0 0 0 12.04 2zm0 18.06h-.01a8.17 8.17 0 0 1-4.2-1.15l-.3-.18-3.09.89.83-3-.2-.31a8.19 8.19 0 0 1-1.28-4.4c0-4.52 3.68-8.2 8.2-8.2 2.19 0 4.25.85 5.8 2.4a8.16 8.16 0 0 1 2.4 5.8c0 4.52-3.68 8.15-8.15 8.15zm4.49-6.13c-.25-.12-1.46-.72-1.68-.81-.23-.08-.39-.12-.56.12-.17.25-.65.81-.8 1-.15.18-.3.2-.55.08-.25-.13-1.07-.39-2.03-1.25-.75-.67-1.26-1.5-1.4-1.75-.15-.25-.02-.39.1-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.12-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.54.61.19 1.16.17 1.6.1.49-.07 1.46-.6 1.67-1.18.21-.57.21-1.07.15-1.18-.06-.11-.23-.17-.48-.3z" />
              </svg>
              <span>Create on WhatsApp</span>
            </a>

            <a
              href="https://t.me/VibeCurator_bot?start=Vibe_Events"
              target="_blank"
              rel="noopener noreferrer"
              className="bot-btn bot-btn-telegram"
            >
              <svg className="bot-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.52 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .37z" />
              </svg>
              <span>Create on Telegram</span>
            </a>
          </div>

          <p className="bot-muted-note">Free for hosts. Edit or cancel anytime from your dashboard.</p>
        </div>

        {/* Right Column: Phone Mockup Simulation */}
        <div className="bot-create-right">
          {/* Mode Switcher Tabs */}
          <div className="bot-tab-toggle" role="tablist" aria-label="Demonstration mode">
            <button
              type="button"
              role="tab"
              id="tab-type"
              aria-selected={mode === 'type'}
              aria-controls="panel-chat-demo"
              onClick={() => setMode('type')}
              className="bot-tab-btn"
            >
              <span>Type it</span>
            </button>
            <button
              type="button"
              role="tab"
              id="tab-poster"
              aria-selected={mode === 'poster'}
              aria-controls="panel-chat-demo"
              onClick={() => setMode('poster')}
              className="bot-tab-btn"
            >
              <span>Send a poster</span>
            </button>
          </div>

          {/* Interactive Phone Frame */}
          <div className="bot-phone-frame">
            <div
              className="bot-phone-screen"
              id="panel-chat-demo"
              role="tabpanel"
              aria-labelledby={mode === 'type' ? 'tab-type' : 'tab-poster'}
            >
              {/* WhatsApp / Telegram Chat Header */}
              <div className="bot-chat-header">
                <div className="bot-avatar" aria-hidden="true">
                  V
                </div>
                <div className="bot-header-info">
                  <div className="bot-header-name">Vibe Bot</div>
                  <div className="bot-header-status">
                    <span className="bot-status-dot" aria-hidden="true" />
                    <span>online</span>
                  </div>
                </div>
              </div>

              {/* Chat Messages Feed */}
              <div className="bot-chat-area" role="region" aria-live="polite" aria-atomic="false">
                {messages.map((msg, idx) => {
                  if (msg.type === 'user-text') {
                    return (
                      <div key={idx} className="bot-bubble-wrapper">
                        <div className="bot-bubble-user">{msg.text}</div>
                      </div>
                    );
                  }

                  if (msg.type === 'user-poster') {
                    return (
                      <div key={idx} className="bot-bubble-wrapper">
                        <div className="bot-poster-card" aria-label="Event Poster">
                          <div className="bot-poster-glow" aria-hidden="true" />
                          <div>
                            <div className="bot-poster-tag">{msg.tag}</div>
                            <div className="bot-poster-title">{msg.title}</div>
                          </div>
                          <div className="bot-poster-bottom">
                            <div className="bot-poster-venue">{msg.venue}</div>
                            <div className="bot-poster-badge">{msg.price}</div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  if (msg.type === 'bot-typing') {
                    return (
                      <div key={idx} className="bot-bubble-wrapper">
                        <div className="bot-typing-bubble" aria-label="Vibe bot is typing...">
                          <span className="bot-typing-dot" />
                          <span className="bot-typing-dot" />
                          <span className="bot-typing-dot" />
                        </div>
                      </div>
                    );
                  }

                  if (msg.type === 'bot-text') {
                    return (
                      <div key={idx} className="bot-bubble-wrapper">
                        <div className="bot-bubble-bot">{msg.text}</div>
                      </div>
                    );
                  }

                  if (msg.type === 'bot-card' && msg.card) {
                    return (
                      <div key={idx} className="bot-bubble-wrapper">
                        <div className="bot-event-card">
                          <div className="bot-event-card-header">
                            <h4 className="bot-event-card-title">{msg.card.title}</h4>
                            {msg.card.isLive && (
                              <span className="bot-live-pill">
                                <span className="bot-live-dot" />
                                Live
                              </span>
                            )}
                          </div>
                          <div className="bot-event-card-body">
                            <div className="bot-card-row">
                              <span className="bot-card-row-label">When:</span>
                              <span className="bot-card-row-value">{msg.card.when}</span>
                            </div>
                            <div className="bot-card-row">
                              <span className="bot-card-row-label">Where:</span>
                              <span className="bot-card-row-value">{msg.card.where}</span>
                            </div>
                            <div className="bot-card-row">
                              <span className="bot-card-row-label">Entry:</span>
                              <span className="bot-card-row-value">{msg.card.entry}</span>
                            </div>
                          </div>
                          <div className="bot-event-card-footer">
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <circle cx="12" cy="12" r="10" />
                              <line x1="2" y1="12" x2="22" y2="12" />
                              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                            </svg>
                            <span>{msg.card.link}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return null;
                })}
              </div>

              {/* Chat Mockup Bottom Input Bar */}
              <div className="bot-input-bar">
                <div className="bot-input-field">
                  <span>Message…</span>
                </div>
                <div className="bot-send-btn" aria-hidden="true">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

