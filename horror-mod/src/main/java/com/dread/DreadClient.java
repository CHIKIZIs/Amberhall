package com.dread;

import com.mojang.blaze3d.systems.RenderSystem;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.networking.v1.ClientPlayNetworking;
import net.fabricmc.fabric.api.client.rendering.v1.EntityModelLayerRegistry;
import net.fabricmc.fabric.api.client.rendering.v1.EntityRendererRegistry;
import net.fabricmc.fabric.api.client.rendering.v1.HudRenderCallback;
import net.minecraft.client.MinecraftClient;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.render.RenderTickCounter;
import net.minecraft.util.Identifier;

public class DreadClient implements ClientModInitializer {
	private static final int FRAMES = 8;
	private static int creature = 1, total = 0, left = 0;

	@Override
	public void onInitializeClient() {
		EntityModelLayerRegistry.registerModelLayer(WatcherModel.LAYER, WatcherModel::getTexturedModelData);
		EntityModelLayerRegistry.registerModelLayer(CrawlerModel.LAYER, CrawlerModel::getTexturedModelData);
		EntityModelLayerRegistry.registerModelLayer(SmileModel.LAYER, SmileModel::getTexturedModelData);
		EntityRendererRegistry.register(ModEntities.WATCHER, WatcherRenderer::new);
		EntityRendererRegistry.register(ModEntities.CRAWLER, CrawlerRenderer::new);
		EntityRendererRegistry.register(ModEntities.SMILE, SmileRenderer::new);
		ClientPlayNetworking.registerGlobalReceiver(JumpscarePayload.ID, (payload, ctx) -> ctx.client().execute(() -> {
			creature = Math.max(1, Math.min(3, payload.image()));
			total = left = Math.max(12, payload.ticks());
		}));
		ClientTickEvents.END_CLIENT_TICK.register(client -> {
			if (left > 0) {
				left--;
				// камера дёргается, как от испуга, пока тварь несётся на экран
				if (client.player != null && left > total - 16) {
					float k = (left - (total - 16)) / 16f;
					client.player.setYaw(client.player.getYaw() + (client.player.getRandom().nextFloat() - 0.5f) * 9f * k);
					client.player.setPitch(client.player.getPitch() + (client.player.getRandom().nextFloat() - 0.5f) * 6f * k);
				}
			}
		});
		HudRenderCallback.EVENT.register(DreadClient::render);
	}

	private static float ease(float x) {
		x = Math.max(0f, Math.min(1f, x));
		return x * x * (3 - 2 * x);
	}

	private static void render(DrawContext ctx, RenderTickCounter tick) {
		if (left <= 0) return;
		MinecraftClient mc = MinecraftClient.getInstance();
		int w = mc.getWindow().getScaledWidth(), h = mc.getWindow().getScaledHeight();
		float p = 1f - (left - tick.getTickDelta(false)) / total;                     // 0 → 1
		var rnd = mc.world != null ? mc.world.random : null;
		if (rnd == null) return;
		// кадр: первые ~45 % времени тварь несётся на камеру (кадры 0..5), потом застывает и «дрожит» на последних
		int idx = p < 0.45f ? Math.min(5, (int) (ease(p / 0.45f) * 5.99f)) : 6 + (rnd.nextFloat() < 0.5f ? 1 : 0);
		float fade = p > 0.82f ? (1f - p) / 0.18f : 1f;
		float shake = p < 0.45f ? 6f : 22f;
		float scale = 1.0f + (p > 0.45f ? (p - 0.45f) * 0.5f : 0f);
		RenderSystem.enableBlend();
		ctx.fill(0, 0, w, h, ((int) (255 * Math.min(1f, fade * 2f)) << 24));
		int size = (int) (Math.max(w, h) * 1.05f * scale);
		float dx = (rnd.nextFloat() - 0.5f) * shake, dy = (rnd.nextFloat() - 0.5f) * shake;
		boolean blink = p > 0.45f && rnd.nextFloat() < 0.12f;                          // мерцание в финале
		if (!blink) {
			RenderSystem.setShaderColor(1f, 1f, 1f, fade);
			ctx.drawTexture(Identifier.of("dread", "textures/gui/scare_" + creature + "_" + idx + ".png"), (int) ((w - size) / 2 + dx), (int) ((h - size) / 2 + dy), size, size, 0, 0, 256, 256, 256, 256);
			RenderSystem.setShaderColor(1f, 1f, 1f, 1f);
		}
		// белая вспышка при старте, красный всплеск, «рваные» чёрные полосы и строки развёртки
		if (p < 0.05f) ctx.fill(0, 0, w, h, (int) (235 * (1f - p / 0.05f)) << 24 | 0xFFFFFF);
		else if (p < 0.2f) ctx.fill(0, 0, w, h, (int) (120 * (1f - (p - 0.05f) / 0.15f)) << 24 | 0xB00000);
		for (int y = 0; y < h; y += 4) ctx.fill(0, y, w, y + 1, 0x33000000);
		for (int i = 0; i < 3; i++) {
			if (rnd.nextFloat() < 0.35f) { int y = rnd.nextInt(h); ctx.fill(0, y, w, y + 2 + rnd.nextInt(10), 0xCC000000); }
		}
		RenderSystem.disableBlend();
	}
}
