import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ publicKey: string }> }
) {
  const { publicKey } = await params;

  const config = await db.agentConfig.findUnique({
    where: { publicKey },
    select: { name: true, widgetButtonLabel: true, widgetEnabled: true },
  });

  if (!config || !config.widgetEnabled) {
    return new NextResponse("// Widget not found or disabled", {
      headers: { "Content-Type": "application/javascript" },
    });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const label = config.widgetButtonLabel ?? "Chat with us";

  const script = `
(function() {
  if (window.__MajesticWidgetLoaded) return;
  window.__MajesticWidgetLoaded = true;

  var AGENT_KEY = "${publicKey}";
  var APP_URL = "${appUrl}";
  var LABEL = "${label.replace(/"/g, '\\"')}";
  var POSITION = (document.currentScript && document.currentScript.getAttribute('data-position')) || 'bottom-right';

  // Inject styles
  var style = document.createElement('style');
  style.textContent = [
    '#mj-launcher { position:fixed; z-index:9999; bottom:24px; right:24px; }',
    '#mj-launcher[data-position="bottom-left"] { right:auto; left:24px; }',
    '#mj-btn { display:flex; align-items:center; gap:8px; padding:12px 20px;',
    '  background:linear-gradient(135deg,#c8900a,#d4a820); color:#06091a;',
    '  border:none; border-radius:24px; cursor:pointer; font-family:sans-serif;',
    '  font-size:14px; font-weight:700; box-shadow:0 4px 18px rgba(200,144,10,0.35);',
    '  transition:transform 0.2s,box-shadow 0.2s; }',
    '#mj-btn:hover { transform:scale(1.04); box-shadow:0 6px 24px rgba(200,144,10,0.5); }',
    '#mj-badge { width:8px; height:8px; background:#4ade80; border-radius:50%;',
    '  box-shadow:0 0 6px #4ade80; }',
    '#mj-frame { display:none; position:fixed; z-index:9998;',
    '  bottom:80px; right:24px; width:420px; height:600px;',
    '  border:none; border-radius:20px; box-shadow:0 20px 60px rgba(0,0,0,0.5); }',
    '#mj-frame.open { display:block; animation:mjSlideIn 0.25s ease-out; }',
    '@keyframes mjSlideIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }',
  ].join('');
  document.head.appendChild(style);

  // Launcher button
  var launcher = document.createElement('div');
  launcher.id = 'mj-launcher';
  launcher.setAttribute('data-position', POSITION);
  launcher.innerHTML = '<button id="mj-btn"><span id="mj-badge"></span>' + LABEL + '</button>';
  document.body.appendChild(launcher);

  // Iframe
  var frame = document.createElement('iframe');
  frame.id = 'mj-frame';
  frame.src = APP_URL + '/agent?embed=1&key=' + AGENT_KEY;
  frame.allow = 'clipboard-write';
  document.body.appendChild(frame);

  // Toggle
  var open = false;
  document.getElementById('mj-btn').addEventListener('click', function() {
    open = !open;
    frame.className = open ? 'open' : '';
  });

  // Close from iframe message
  window.addEventListener('message', function(e) {
    if (e.data === 'mj:close') { open = false; frame.className = ''; }
  });
})();
`.trim();

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
