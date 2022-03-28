import type { GetServerSideProps, NextPage } from 'next';
import { Box, Button, Flex, Heading, Spacer, VStack } from '@chakra-ui/react';
import { Session, UserScore } from 'types/Score';
import { TwitterLogin } from 'components/home/TwitterLogin';
import { User } from 'types/User';
import { useRef } from 'react';
import html2canvas from 'html2canvas';
import { FaTwitter } from 'react-icons/fa';
import ScoreVisual from 'components/score/ScoreVisual';

interface Props {
  session?: Session;
  userScore?: UserScore;
  hasError?: boolean;
  error?: Record<string, any>;
  user?: User;
}

const ScorePage: NextPage<Props> = (props: Props) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const { userScore, hasError, error, user } = props;
  const handleClick = () => {
    const current = ref.current as HTMLDivElement;
    if (current) {
      html2canvas(current, { allowTaint: true }).then(function (canvas) {
        document.body.appendChild(canvas);
      });
    }
  };

  if (hasError) {
    return (
      <VStack h={'100vh'} justifyContent={'center'}>
        <Heading>{error?.message}</Heading>
        {error?.isUnauthorized && <TwitterLogin />}
      </VStack>
    );
  }

  return (
    <div>
      <Flex
        flex={1}
        h={'100vh'}
        w={'100%'}
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
        pb="10px"
      >
        <Flex w={'100%'} color={'white'} bgColor="white">
          <Spacer />
          <Box ref={ref} w={['80%', '50%']}>
            <ScoreVisual userScore={userScore as UserScore} user={user} />
          </Box>
          <Spacer />
        </Flex>

        <Button
          mt={3}
          leftIcon={<FaTwitter />}
          colorScheme={'twitter'}
          onClick={handleClick}
        >
          Share
        </Button>
      </Flex>
    </div>
  );
};

export default ScorePage;

export const getServerSideProps: GetServerSideProps<Props> = async (ctx) => {
  const { username } = ctx.query;

  if (!username) {
    return {
      props: {
        hasError: true,
        error: {
          message: 'Bad Request',
        },
      },
    };
  }

  const httpProtocol = ctx.req.headers.host?.includes('localhost')
    ? 'http'
    : 'https';

  const url = `${httpProtocol}://${ctx.req.headers.host}/api/score/${username}`;

  const response = await fetch(url);

  if (response.status !== 200) {
    const { message } = await response.json();
    return {
      props: {
        hasError: true,
        error: {
          message,
          isUnauthorized: response.status === 401,
        },
      },
    };
  }
  const data = await response.json();

  const { userScore, user }: { userScore: UserScore; user: User } = data;

  return {
    props: {
      userScore: userScore || null,
      user: user || null,
    },
  };
};
