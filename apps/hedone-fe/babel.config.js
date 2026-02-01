const t = require('@babel/core').types;

/** Substitui import.meta por um objeto seguro para o bundle web (script clássico). */
function replaceImportMetaPlugin() {
  return {
    visitor: {
      MetaProperty(path) {
        if (
          path.node.meta?.name === 'import' &&
          path.node.property?.name === 'meta'
        ) {
          path.replaceWith(
            t.objectExpression([
              t.objectProperty(t.identifier('url'), t.stringLiteral('')),
              t.objectProperty(
                t.identifier('env'),
                t.objectExpression([])
              ),
            ])
          );
        }
      },
    },
  };
}

module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [replaceImportMetaPlugin],
  };
};
