import path from 'path';
import glsl from 'vite-plugin-glsl';

const dirname = path.dirname(new URL(import.meta.url).pathname);

export default {
  root: path.resolve(dirname, 'src'),
  build: {
    outDir: path.resolve(dirname, 'dist'),
    rollupOptions: {
      input: {
        index: path.resolve(dirname, 'src', 'index.html'),
        '01': path.resolve(dirname, 'src', '01/index.html'),
        '02': path.resolve(dirname, 'src', '02/index.html'),
        '03': path.resolve(dirname, 'src', '03/index.html'),
        '04': path.resolve(dirname, 'src', '04/index.html'),
        '05': path.resolve(dirname, 'src', '05/index.html'),
        '06': path.resolve(dirname, 'src', '06/index.html'),
      },
    },
  },
  plugins: [glsl()],
};
