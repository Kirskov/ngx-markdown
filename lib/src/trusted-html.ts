// Minimal local declarations for the Trusted Types API. The DOM lib does not
// ship them yet and `@types/trusted-types` is only available transitively, so
// the library declares what it needs instead of depending on those typings.
interface TrustedTypePolicyLike {
  createHTML(input: string): string;
}

interface TrustedTypePolicyFactoryLike {
  createPolicy(
    name: string,
    rules: { createHTML(input: string): string },
  ): TrustedTypePolicyLike;
}

/**
 * Name of the Trusted Types policy this library creates.
 *
 * Applications enforcing `require-trusted-types-for 'script'` and restricting
 * policy names with the `trusted-types` directive have to allow this name.
 */
export const NGX_MARKDOWN_TRUSTED_TYPES_POLICY = 'ngx-markdown';

let policy: TrustedTypePolicyLike | null | undefined;

function getPolicy(): TrustedTypePolicyLike | null {
  if (policy !== undefined) {
    return policy;
  }
  policy = null;
  const trustedTypes = (globalThis as { trustedTypes?: TrustedTypePolicyFactoryLike }).trustedTypes;
  if (trustedTypes?.createPolicy) {
    try {
      policy = trustedTypes.createPolicy(NGX_MARKDOWN_TRUSTED_TYPES_POLICY, {
        createHTML: html => html,
      });
    } catch {
      // the `trusted-types` directive disallows this name, or a policy with
      // this name was already created; fall back to the plain string
      policy = null;
    }
  }
  return policy;
}

/**
 * Marks html as trusted so it can be assigned to `innerHTML` on pages that
 * enforce `require-trusted-types-for 'script'`.
 *
 * Returns the input unchanged when Trusted Types are unavailable or the policy
 * could not be created, which leaves behaviour untouched everywhere else.
 *
 * The caller is responsible for the value being safe. The policy performs no
 * sanitization of its own, exactly like the one Angular uses internally.
 */
export function trustedHtml(html: string): string {
  return getPolicy()?.createHTML(html) ?? html;
}

/** @internal Visible for testing. Discards the memoized policy. */
export function ɵresetTrustedTypesPolicyForTesting(): void {
  policy = undefined;
}
