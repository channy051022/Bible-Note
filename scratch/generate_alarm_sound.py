import wave
import struct
import math

def generate_spiritual_chime(output_path="assets/spiritual_alarm.wav"):
    sample_rate = 44100
    duration_per_loop = 6.0
    total_samples = int(sample_rate * duration_per_loop)

    # Melodic spiritual bell chord frequencies (Hz)
    # E.g. Heavenly Chimes: C5 (523.25), E5 (659.25), G5 (783.99), B5 (987.77), C6 (1046.50), E6 (1318.51)
    notes = [
        (0.0, 523.25, 1.8),   # C5
        (0.6, 659.25, 1.8),   # E5
        (1.2, 783.99, 1.8),   # G5
        (1.8, 1046.50, 2.5),  # C6 (bright bell)
        (2.8, 880.00, 1.8),   # A5
        (3.4, 783.99, 1.8),   # G5
        (4.0, 659.25, 2.2),   # E5
        (4.8, 523.25, 3.0),   # C5 resonant root
    ]

    audio_samples = [0.0] * total_samples

    for note_start_time, freq, note_duration in notes:
        start_sample = int(note_start_time * sample_rate)
        note_length_samples = int(note_duration * sample_rate)

        for i in range(note_length_samples):
            idx = start_sample + i
            if idx >= total_samples:
                break

            t = i / sample_rate
            # Bell envelope: sharp attack, exponential decay with shimmer
            envelope = math.exp(-3.2 * (t / note_duration)) * min(1.0, t * 80.0)

            # Fundamental + harmonics (tubular church bell acoustics)
            h1 = math.sin(2.0 * math.pi * freq * t)
            h2 = 0.5 * math.sin(2.0 * math.pi * (freq * 2.0) * t) * math.exp(-4.5 * t)
            h3 = 0.25 * math.sin(2.0 * math.pi * (freq * 3.0) * t) * math.exp(-6.0 * t)
            h4 = 0.15 * math.sin(2.0 * math.pi * (freq * 4.2) * t) * math.exp(-8.0 * t) # bell strike overtone

            sample_val = (h1 + h2 + h3 + h4) * envelope * 0.4
            audio_samples[idx] += sample_val

    # Normalize audio to prevent clipping and maximize volume
    max_val = max(abs(s) for s in audio_samples) or 1.0
    normalized_samples = [s / max_val * 0.92 for s in audio_samples]

    with wave.open(output_path, 'wb') as wav_file:
        wav_file.setnchannels(1) # Mono
        wav_file.setsampwidth(2) # 16-bit
        wav_file.setframerate(sample_rate)

        packed_data = bytearray()
        for s in normalized_samples:
            int_val = int(s * 32767.0)
            packed_data.extend(struct.pack('<h', int_val))

        wav_file.writeframes(packed_data)

    print(f"Spiritual alarm chime generated successfully at {output_path}!")

if __name__ == "__main__":
    generate_spiritual_chime()
