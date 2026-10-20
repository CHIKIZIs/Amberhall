package com.dread;

import com.mojang.blaze3d.systems.RenderSystem;
import net.fabricmc.api.ClientModInitializer;
import net.fabricmc.fabric.api.client.event.lifecycle.v1.ClientTickEvents;
import net.fabricmc.fabric.api.client.networking.v1.ClientPlayNetworking;
import net.fabricmc.fabric.api.client.rendering.v1.EntityModelLayerRegistry;
import net.fabricmc.fabric.api.client.rendering.v1.EntityRendererRegistry;
import net.fabricmc.fabric.api.client.rendering.v1.HudRenderCallback;
import net.minecraft.client.gui.DrawContext;
import net.minecraft.client.MinecraftClient;
import net.minecraft.util.Identifier;

public class DreadClient implements ClientModInitializer {
	private static int image = 1, total = 0, left = 0;

	@Override
	public void onInitializeClient() {
		EntityModelLayerRegistry.registerModelLayer(WatcherModel.LAYER, WatcherModel::getTexturedModelData);
		EntityRendererRegistry.register(ModEntities.WATCHER, WatcherRenderer::new);
		ClientPlayNetworking.registerGlobalReceiver(JumpscarePayload.ID, (payload, ctx) -> ctx.client().execute(() -> {
			image = payload.image();
			total = left = Math.max(8, payload.ticks());
		}));
		ClientTickEvents.END_CLIENT_TICK.register(client -> {
			if (left > 0) left--;
		});
		HudRenderCallback.EVENT.register(DreadClient::render);
	}

	private static void render(DrawContext ctx, net.minecraft.client.render.RenderTickCounter tick) {
		if (left <= 0) return;
		MinecraftClient mc = MinecraftClient.getInstance();
		int w = mc.getWindow().getScaledWidth(), h = mc.getWindow().getScaledHeight();
		float progress = 1f - (left - tick.getTickDelta(false)) / total;           // 0 → 1
		var rnd = mc.world != null ? mc.world.random : null;
		float fade = progress > 0.75f ? (1f - progress) / 0.25f : 1f;              // в конце гаснет
		boolean flicker = rnd != null && progress < 0.7f && rnd.nextFloat() < 0.18f;   // мерцание
		float scale = 1.0f + progress * 0.35f;                                    // «лезет» на экран
		float dx = rnd != null ? (rnd.nextFloat() - 0.5f) * 26f * (1f - progress * 0.5f) : 0, dy = rnd != null ? (rnd.nextFloat() - 0.5f) * 26f * (1f - progress * 0.5f) : 0;
		RenderSystem.enableBlend();
		// чёрный фон и красная вспышка в первые тики
		ctx.fill(0, 0, w, h, ((int) (255 * fade) << 24));
		if (progress < 0.12f) ctx.fill(0, 0, w, h, (int) (200 * (1f - progress / 0.12f)) << 24 | 0xC01010);
		if (!flicker) {
			int size = (int) (Math.max(w, h) * scale);
			RenderSystem.setShaderColor(1f, 1f, 1f, fade);
			ctx.drawTexture(Identifier.of("dread", "textures/gui/scare_" + image + ".png"), (int) ((w - size) / 2 + dx), (int) ((h - size) / 2 + dy), size, size, 0, 0, 512, 512, 512, 512);
			RenderSystem.setShaderColor(1f, 1f, 1f, 1f);
		}
		RenderSystem.disableBlend();
	}
}
