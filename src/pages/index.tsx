import { SignedIn, SignedOut, UserButton, useUser } from "@clerk/nextjs";
import { type NextPage } from "next";
import { SignInButton } from "@clerk/nextjs";
import { api } from "~/utils/api";
import Image from "next/image";
import { LoadingPage, LoadingSpinner } from "~/components/loading";
import { useState } from "react";
import toast from "react-hot-toast";
import { PageLayout } from "~/components/layout";
import { PostView } from "~/components/postview";

const CreatePostWizard = () => {
  const { user } = useUser();

  const [input, setInput] = useState("");

  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.posts.getAll.invalidate();
    },
    onError: (e) => {
      const errorMessage = e.data?.zodError?.fieldErrors.content;
      if (errorMessage && errorMessage[0]) {
        toast.error(errorMessage[0]);
      } else {
        // TODO: Make a more specific error message for when the error is thrown by rate limits
        toast.error("Failed to post! Please try again later.");
      }
    },
  });

  console.log(user);

  if (!user) return null;

  return (
    <div className="flex w-full gap-3">
      <Image
        src={user.profileImageUrl}
        alt="Profile image"
        className="h-14 w-14 rounded-full"
        width={56}
        height={56}
      />
      <input
        placeholder="Type some emojis!"
        className="grow bg-transparent outline-none"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key == "Enter") {
            e.preventDefault();
            if (input != "") {
              mutate({ content: input });
            }
          }
        }}
        disabled={isPosting}
      />

      {/* Make sure that the post button is disabled when we're in the middle of posting */}
      {/* Specifically, the button doesn't appear when the input is empty and when the current state isPosting is true */}
      {input !== "" && !isPosting && (
        <button onClick={() => mutate({ content: input })}>Post</button>
      )}

      {/* If the current state is isPosting, then we show a LoadingSpinner instead of the post button */}
      {isPosting && (
        <div className="flex items-center justify-center">
          <LoadingSpinner size={20} />
        </div>
      )}
    </div>
  );
};

const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();
  if (postsLoading) return <LoadingPage />;
  if (!data) return <div>Something went wrong</div>;

  return (
    <div className="flex flex-col">
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const Home: NextPage = () => {
  const { isLoaded: userLoaded } = useUser();

  // Start fetching early
  api.posts.getAll.useQuery();

  // Return empty div if user isn't loaded
  if (!userLoaded) return <div />;

  return (
    <>
      <PageLayout>
        {/* 1. Creating post wizard depending on whether user is logged in */}
        <div className="flex border-b border-slate-400 p-4">
          {/* Mount the UserButton component and load the post wizard*/}
          <SignedIn>
            <CreatePostWizard />
            <div className="fixed bottom-0 right-0">
              <UserButton />
            </div>
          </SignedIn>

          {/* Signed out users get sign in button */}
          <SignedOut>
            <SignInButton />
          </SignedOut>
        </div>

        {/* 2. Then we load the feed */}
        <Feed />
      </PageLayout>
    </>
  );
};

export default Home;
