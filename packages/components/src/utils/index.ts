import type { App, Plugin } from "vue";

function withInstall<T>(comp: T) {
  const c = comp as any;
  c.install = (app: App) => {
    app.component(c.displayName || c.name, comp);
  }

  return comp as T & Plugin
}

export {
  withInstall
}
