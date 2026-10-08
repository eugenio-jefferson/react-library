import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface BookCardProps {
  readonly title: string;
  readonly author: string;
  readonly cover_image: string;
}

function BookCard({ title, author, cover_image }: BookCardProps) {
  return (
    <Card className="relative mx-auto w-full max-w-3xs pt-0">
      <div className="absolute inset-0 z-30 aspect-video bg-black/35" />
      <img
        src={cover_image}
        alt={title}
        className="relative z-20 aspect-2/3 object-cover brightness-60 grayscale dark:brightness-40"
      />
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{author}</CardDescription>
      </CardHeader>
    </Card>
  );
}

export default BookCard;
