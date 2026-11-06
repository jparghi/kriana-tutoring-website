'use client'

import { useEffect } from 'react'

// Facebook ad visitors must land on the hero, not partway down the page.
// Two things can push a fresh load down: a #fragment in the link (e.g.
// #register jumps to the form) and the browser restoring an old scroll
// position. The inline script runs during HTML parsing, before the browser
// scrolls to the fragment, and drops both. The effect is a fallback for
// browsers that already scrolled. Only the confirmation page's "Register
// another child" link (?another=1) is left alone; QuickBook scrolls it to the form.
const script = `(function(){try{
var q=new URLSearchParams(location.search);
if(q.get('another')==='1')return;
if('scrollRestoration' in history)history.scrollRestoration='manual';
if(location.hash)history.replaceState(history.state,'',location.pathname+location.search);
}catch(e){}})()`

export function StartAtTop() {
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search)
      if (q.get('another') === '1') return
      if (window.scrollY > 0) window.scrollTo(0, 0)
    } catch { /* never block the page over this */ }
  }, [])

  return <script dangerouslySetInnerHTML={{ __html: script }} />
}
