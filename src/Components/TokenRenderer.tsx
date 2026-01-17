import { twMerge } from "tailwind-merge";

interface TokenRendererProps {
	text: string;
	isSignificant: boolean;
	isPartiallyRecorded: boolean;
	isRecorded: boolean;
	isPendingStart: boolean;
	isPendingEnd: boolean;
	isManuallyIgnored: boolean;
}

export default function TokenRenderer({ text, isSignificant, isPartiallyRecorded, isRecorded, isPendingStart, isPendingEnd, isManuallyIgnored }: TokenRendererProps) {
	const className = ["transition-colors", "duration-150", "text-gray-300"];

	// n.b. Don't change succeeding branches to `else if` - they are not mutually exclusive

	if (isPendingEnd) className.push("bg-orange-800");

	if (isPendingStart) className.push("bg-yellow-300", "text-gray-800");

	if (isPartiallyRecorded) className.push("text-teal-500");

	if (isRecorded) className.push("text-green-600");

	if (isManuallyIgnored) className.push("text-red-600");

	if (!isSignificant) className.push("text-gray-500");

	return <span className={twMerge(className)}>{text}</span>;
}
