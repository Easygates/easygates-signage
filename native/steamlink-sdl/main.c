/* NovaSign native renderer sketch — Steam Link SDK (SDL2 + GLES2).
 * Build inside the steamlink-sdk container per Valve docs:
 *   source ./setenv.sh && make
 * This file documents structure; flesh out with stb_image + cJSON + curl.
 */
#include <stdio.h>
#include <string.h>
#include <unistd.h>
/* #include <SDL.h> */
/* #include <GLES2/gl2.h> */

#define CMS_URL "http://192.168.1.10:3000/api/player?displayId=SCREEN_ID"
#define POLL_SEC 30

typedef struct { char template[32]; char headline[128]; char imageUrl[256]; int durationSec; } Scene;

/* 1. poll CMS */
static int fetch_playlist(const char *url) {
  printf("[novasign] GET %s\n", url);
  /* curl_easy_perform(...) → parse scenes JSON → download new assets */
  return 0;
}

/* 2. per-template layout: replicate SceneRenderer.tsx geometry at 1920x1080.
 * retail-promo: left text column (x 96..960), right image card (x 1020..1824).
 * food-menu:    left hero (x 76..860), right list rows of 5.
 * showcase/campaign: fullscreen image + gradient scrims + bottom-left type.
 * grid:         4 cards, staggered 90ms entrances.
 * announcement: centered stack. split: 960px image + 960px offer stack. */

/* 3. timeline runner: t=0 bg → 150ms image → 350ms+stagger cascade → hold → exit wipe */
static void play_scene(const Scene *s) {
  printf("[novasign] play %s (%ds)\n", s->template, s->durationSec);
  /* animate with fixed timestep; transform/opacity only; cap 30fps */
  sleep(s->durationSec > 0 ? s->durationSec : 10);
}

int main(void) {
  printf("[novasign] native renderer sketch — see README\n");
  for (;;) {
    fetch_playlist(CMS_URL);
    Scene demo = { .template = "retail-promo", .durationSec = 10 };
    strcpy(demo.headline, "Auralux X9 Wireless");
    play_scene(&demo);
    sleep(POLL_SEC);
  }
  return 0;
}
