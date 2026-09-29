# Fairbanks listing (Elementor page 1722, room type 1857)

Exact edits. Nothing here is saved on the live site yet.

## Text widget `b435c4f`
| Find | Replace with |
|---|---|
| `Duplex building with two independent private apartments (host lives in separate downstairs unit)` | `Duplex building with two independent private apartments` |
| `While we allow up to 5 guests` | `While we allow up to 4 guests` |
| `Host lives in separate downstairs unit with separate entrance.` | `The downstairs unit is a separate apartment with its own entrance.` |
| the whole `<p>` starting `On-site dog: Daniel the Spaniel` | *(delete)* |

## Accordion `f6c0d86` (pet FAQ)
- Item 2: delete the sentence starting `Please note that our on-site dog, Daniel the Spaniel`
- Item 3: `shared with the host's downstairs unit` → `shared with the downstairs unit`

## Console snippet (run in the Elementor editor for page 1722)
```js
const fix = (id, key, pairs) => {
  const c = elementor.getContainer(id);
  let v = c.settings.get(key);
  for (const [a, b] of pairs) v = v.split(a).join(b);
  $e.run('document/elements/settings', { container: c, settings: { [key]: v } });
};
fix('b435c4f', 'editor', [
  [' (host lives in separate downstairs unit)', ''],
  ['While we allow up to 5 guests', 'While we allow up to 4 guests'],
  ['Host lives in separate downstairs unit with separate entrance.', 'The downstairs unit is a separate apartment with its own entrance.'],
]);
// delete the Daniel paragraph
{ const c = elementor.getContainer('b435c4f');
  const v = c.settings.get('editor').replace(/<p>[^<]*On-site dog: Daniel the Spaniel[\s\S]*?<\/p>\s*/i, '');
  $e.run('document/elements/settings', { container: c, settings: { editor: v } }); }
// accordion items are children of f6c0d86 — inspect first:
elementor.getContainer('f6c0d86').children.map(ch => ch.settings.attributes);
// then edit item 2 / item 3 content field with the same split/join pattern, and:
// $e.run('document/save/update');
// Final check (should print []):
JSON.stringify(elementor.elements.toJSON()).match(/Daniel|lives in|on-site dog|host's/gi);
```

## Also check
- Room type 1857: description has no host/dog mentions; capacity = 4 (adults+children max).
- `/rosella-guide/`: remove any "host lives downstairs" or dog lines.
- Icon-list item "Good Neighbor Guide" → `https://auroraandcedarstays.com/rosella-guide/` loads logged-out.
