// Mock implementation of next/navigation for Storybook
export function useRouter() {
  return {
    back: () => console.log('Router.back()'),
    forward: () => console.log('Router.forward()'),
    refresh: () => console.log('Router.refresh()'),
    push: (url) => console.log('Router.push()', url),
    replace: (url) => console.log('Router.replace()', url),
    prefetch: (url) => Promise.resolve(),
  };
}

export function usePathname() {
  return '/';
}

export function useSearchParams() {
  return new URLSearchParams();
}

export function useParams() {
  return {};
}

export function notFound() {
  console.log('notFound() called');
}

export function redirect(url) {
  console.log('redirect() called with', url);
}