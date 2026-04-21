import { motion } from "framer-motion";

export function Blobs() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-primary/30 blur-3xl animate-blob"
      />
      <motion.div
        className="absolute top-1/3 -right-40 h-[32rem] w-[32rem] rounded-full bg-secondary/25 blur-3xl animate-blob"
        style={{ animationDelay: "4s" }}
      />
      <motion.div
        className="absolute -bottom-40 left-1/3 h-[26rem] w-[26rem] rounded-full bg-accent/20 blur-3xl animate-blob"
        style={{ animationDelay: "8s" }}
      />
    </div>
  );
}
