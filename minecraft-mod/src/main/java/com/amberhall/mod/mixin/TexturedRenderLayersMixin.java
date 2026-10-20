package com.amberhall.mod.mixin;

import java.util.HashMap;
import java.util.Map;

import com.amberhall.mod.AmberhallMod;
import com.amberhall.mod.WoodChestBlockEntity;
import net.minecraft.block.entity.BlockEntity;
import net.minecraft.block.enums.ChestType;
import net.minecraft.client.render.TexturedRenderLayers;
import net.minecraft.client.util.SpriteIdentifier;
import org.spongepowered.asm.mixin.Mixin;
import org.spongepowered.asm.mixin.injection.At;
import org.spongepowered.asm.mixin.injection.Inject;
import org.spongepowered.asm.mixin.injection.callback.CallbackInfoReturnable;

/** Подменяет текстуру сундука на «деревянную» для сундуков мода (ванильное решение захардкожено). */
@Mixin(TexturedRenderLayers.class)
public abstract class TexturedRenderLayersMixin {
	private static final Map<String, SpriteIdentifier> AMBERHALL_CHEST_SPRITES = new HashMap<>();

	@Inject(method = "getChestTextureId(Lnet/minecraft/block/entity/BlockEntity;Lnet/minecraft/block/enums/ChestType;Z)Lnet/minecraft/client/util/SpriteIdentifier;",
		at = @At("HEAD"), cancellable = true)
	private static void amberhall$woodChest(BlockEntity entity, ChestType type, boolean christmas, CallbackInfoReturnable<SpriteIdentifier> cir) {
		if (entity instanceof WoodChestBlockEntity chest) {
			String suffix = type == ChestType.LEFT ? "_left" : type == ChestType.RIGHT ? "_right" : "";
			String path = "entity/chest/" + chest.wood() + suffix;
			cir.setReturnValue(AMBERHALL_CHEST_SPRITES.computeIfAbsent(path,
				p -> new SpriteIdentifier(TexturedRenderLayers.CHEST_ATLAS_TEXTURE, AmberhallMod.id(p))));
		}
	}
}
