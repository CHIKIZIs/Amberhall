package com.dread;

import net.fabricmc.fabric.api.networking.v1.ServerPlayNetworking;
import net.minecraft.entity.effect.StatusEffectInstance;
import net.minecraft.entity.effect.StatusEffects;
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.sound.SoundCategory;

/** Скример: картинка на весь экран + крик и удар, ослепление и замедление. */
public final class Jumpscare {
	private Jumpscare() {
	}

	public static void trigger(ServerPlayerEntity player, int image, boolean hurt) {
		ServerPlayNetworking.send(player, new JumpscarePayload(image, 34));
		player.playSoundToPlayer(DreadSounds.STING, SoundCategory.HOSTILE, 1.6f, 1.0f);
		player.playSoundToPlayer(DreadSounds.SCREAM, SoundCategory.HOSTILE, 1.8f, 0.95f + player.getRandom().nextFloat() * 0.1f);
		player.addStatusEffect(new StatusEffectInstance(StatusEffects.DARKNESS, 120, 0, false, false, false));
		player.addStatusEffect(new StatusEffectInstance(StatusEffects.SLOWNESS, 50, 2, false, false, false));
		if (hurt && player.getHealth() > 6.0f) {
			player.damage(player.getWorld().getDamageSources().magic(), 4.0f);
		}
	}
}
