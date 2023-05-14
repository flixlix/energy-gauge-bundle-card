import typescript from 'rollup-plugin-typescript2';
import commonjs from 'rollup-plugin-commonjs';
import nodeResolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import { terser } from 'rollup-plugin-terser';
import serve from 'rollup-plugin-serve';
import json from '@rollup/plugin-json';
import minifyHTML from 'rollup-plugin-minify-html-literals';

const dev = process.env.ROLLUP_WATCH;

const serveopts = {
  contentBase: ['./dist'],
  host: '0.0.0.0',
  port: 5000,
  allowCrossOrigin: true,
  headers: {
    'Access-Control-Allow-Origin': '*',
  },
};

const plugins = [
  nodeResolve({}),
  commonjs(),
  typescript(),
  json({
    compact: true,
  }),
  babel({
    exclude: 'node_modules/**',
  }),
  dev && serve(serveopts),
  !dev && minifyHTML(),
  !dev && terser({ output: { comments: false } }),
];

export default [
  {
    input: ['src/energy-gauge-bundle-card.ts'],
    output: {
      dir: 'dist',
      format: 'es',
      inlineDynamicImports: true,
    },
    plugins: [
      minifyHTML(),
      terser({ output: { comments: false } }),
      typescript({
        declaration: false,
      }),
      nodeResolve(),
      json({
        compact: true,
      }),
      commonjs(),
      babel({
        exclude: "node_modules/**",
        babelHelpers: "bundled",
      }),
      ...(dev ? [serve(serveOptions)] : [terser()]),
    ],
    moduleContext: (id) => {
      const thisAsWindowForModules = [
        "node_modules/@formatjs/intl-utils/lib/src/diff.js",
        "node_modules/@formatjs/intl-utils/lib/src/resolve-locale.js",
      ];
      if (thisAsWindowForModules.some((id_) => id.trimRight().endsWith(id_))) {
        return "window";
      }
    },
  },
];
