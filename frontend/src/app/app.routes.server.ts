import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  {
    path: 'financial/transactions/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [
      { id: '1' },
      { id: '2' },
      { id: '3' }
    ]
  },
  {
    path: 'financial/categories/:id/edit',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => [
      { id: '1' },
      { id: '2' },
      { id: '3' }
    ]
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
