'use strict';
const EXPECTED = Object.freeze({
  current_state: 'The lighthouse prototype is ready for review.',
  next_step: 'Run the accessibility review.',
  open_decision: 'Choose email or passkey sign-in.',
});
function check(answer) {
  const assertions = Object.entries(EXPECTED).map(([fact, expected]) => ({
    fact, pass: typeof answer?.[fact] === 'string' && answer[fact].trim() === expected,
  }));
  const passed = assertions.filter(a => a.pass).length;
  return { pass: passed === assertions.length, score: passed / assertions.length, assertions };
}
module.exports = { check };
