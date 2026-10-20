package com.dread;

import net.minecraft.network.RegistryByteBuf;
import net.minecraft.network.codec.PacketCodec;
import net.minecraft.network.packet.CustomPayload;

/** Пакет «сделай скример»: какую картинку показать (1–3) и на сколько тиков. */
public record JumpscarePayload(int image, int ticks) implements CustomPayload {
	public static final Id<JumpscarePayload> ID = new Id<>(DreadMod.id("jumpscare"));
	public static final PacketCodec<RegistryByteBuf, JumpscarePayload> CODEC = PacketCodec.tuple(
		PacketCodec.ofStatic((buf, v) -> ((net.minecraft.network.PacketByteBuf) buf).writeVarInt(v), buf -> ((net.minecraft.network.PacketByteBuf) buf).readVarInt()), JumpscarePayload::image,
		PacketCodec.ofStatic((buf, v) -> ((net.minecraft.network.PacketByteBuf) buf).writeVarInt(v), buf -> ((net.minecraft.network.PacketByteBuf) buf).readVarInt()), JumpscarePayload::ticks,
		JumpscarePayload::new);

	@Override
	public Id<? extends CustomPayload> getId() {
		return ID;
	}
}
