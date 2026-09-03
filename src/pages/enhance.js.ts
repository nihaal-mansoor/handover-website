import type { APIRoute } from "astro";

/**
 * Progressive enhancement, served as a file so the CSP needs no nonce and no
 * 'unsafe-inline'. (CLAUDE.md §4.3)
 *
 * Everything here is additive. With this script blocked or disabled the
 * checklist still discloses and ticks, and the form still points to WhatsApp.
 */
export const prerender = true;

const SCRIPT = String.raw`
(function () {
  'use strict';

  /* ---------- checklist progress ---------- */
  var KEY = 'handover.progress.v1';
  var root = document.querySelector('[data-checklist]');

  if (root) {
    var boxes = Array.prototype.slice.call(root.querySelectorAll('[data-stage]'));
    var progress = root.querySelector('[data-progress]');
    var resetBtn = root.querySelector('[data-reset]');

    var read = function () {
      try { return JSON.parse(localStorage.getItem(KEY) || '{}'); }
      catch (e) { return {}; }
    };
    var write = function (state) {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    };

    var paint = function () {
      var done = 0;
      boxes.forEach(function (box) {
        var item = box.closest('li');
        var label = item.querySelector('[data-stage-label]');
        var title = item.querySelector('[data-title]');
        var number = item.querySelector('[data-number]');
        if (box.checked) {
          done++;
          label.textContent = 'Done';
          label.style.color = 'var(--ok)';
          title.style.textDecoration = 'line-through';
          number.style.color = 'var(--ok)';
          number.style.opacity = '0.65';
        } else {
          label.textContent = 'Mark complete';
          label.style.color = '';
          title.style.textDecoration = 'none';
          number.style.color = 'var(--spot)';
          number.style.opacity = '1';
        }
      });
      progress.innerHTML =
        '<span style="font-weight:600;color:var(--ink)">' + done + '</span> of ' +
        boxes.length + ' stages marked complete';
      resetBtn.classList.toggle('hidden', done === 0);
    };

    var state = read();
    boxes.forEach(function (box) {
      if (state[box.dataset.stage]) box.checked = true;
      box.addEventListener('change', function () {
        var next = read();
        next[box.dataset.stage] = box.checked;
        write(next);
        paint();
      });
    });
    resetBtn.addEventListener('click', function () {
      boxes.forEach(function (b) { b.checked = false; });
      write({});
      paint();
    });
    paint();
  }

  /* ---------- lead form ---------- */
  var form = document.getElementById('lead-form');
  var status = document.getElementById('form-status');
  if (!form || !status) return;

  var renderedAt = Date.now();
  var FIELDS = ['name', 'email', 'phone', 'message', 'consent'];

  var clearErrors = function () {
    FIELDS.forEach(function (f) {
      var el = document.getElementById(f + '-error');
      var input = document.getElementById(f);
      if (el) { el.textContent = ''; el.hidden = true; }
      if (input) input.removeAttribute('aria-invalid');
    });
  };

  var showErrors = function (errors) {
    var first = null;
    Object.keys(errors).forEach(function (field) {
      var el = document.getElementById(field + '-error');
      var input = document.getElementById(field);
      if (el) { el.textContent = errors[field]; el.hidden = false; }
      if (input) {
        input.setAttribute('aria-invalid', 'true');
        if (!first) first = input;
      }
    });
    if (first) first.focus();
  };

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    clearErrors();

    var button = form.querySelector('button[type=submit]');
    button.disabled = true;
    status.hidden = false;
    status.textContent = 'Sending…';

    var data = {};
    new FormData(form).forEach(function (value, key) { data[key] = value; });
    data.consent = document.getElementById('consent').checked;
    data.renderedAt = renderedAt;
    data.sourcePage = window.location.pathname;
    var token = form.querySelector('[name=cf-turnstile-response]');
    if (token) data.turnstileToken = token.value;

    fetch('/api/lead', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(data)
    })
      .then(function (response) {
        return response.json().then(function (body) {
          return { ok: response.ok, body: body };
        });
      })
      .then(function (result) {
        if (result.ok && result.body.ok) {
          form.hidden = true;
          status.textContent = result.body.message;
          status.setAttribute('tabindex', '-1');
          status.focus();
          return;
        }
        if (result.body.errors) showErrors(result.body.errors);
        status.textContent = result.body.message || 'Something went wrong.';
      })
      .catch(function () {
        status.textContent = 'Could not send. Please try WhatsApp instead.';
      })
      .finally(function () { button.disabled = false; });
  });
})();
`;

export const GET: APIRoute = () =>
  new Response(SCRIPT, {
    headers: {
      "content-type": "text/javascript; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
