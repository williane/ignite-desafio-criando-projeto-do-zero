import { useEffect, useMemo } from 'react';
import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';
import Link from 'next/link';

import { RichText } from 'prismic-dom';
import Prismic from '@prismicio/client';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  navigation: {
    prevPost?: {
      uid: string;
      data: {
        title: string;
      };
    };
    nextPost?: {
      uid: string;
      data: {
        title: string;
      };
    };
  };
  preview: boolean;
}

export default function Post({
  post,
  navigation,
  preview,
}: PostProps): JSX.Element {
  const router = useRouter();

  useEffect(() => {
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-comments-for-uterances');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', 'true');
    script.setAttribute(
      'repo',
      'williane/ignite-desafio-criando-projeto-do-zero'
    );
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'github-dark');
    anchor.appendChild(script);
  }, []);

  const timeOfReading = useMemo(() => {
    if (router.isFallback) {
      return 0;
    }

    const wordsPerMinute = 200;

    const contentWords = post.data.content.reduce(
      (summedContents, currentContent) => {
        const headingWords = currentContent.heading.split(/\s/g).length;

        const bodyText = RichText.asText(currentContent.body);
        const bodyWords = bodyText.split(/\s/g).length;

        return summedContents + headingWords + bodyWords;
      },
      0
    );

    const minutes = contentWords / wordsPerMinute;
    const readTime = Math.ceil(minutes);

    return readTime;
  }, [post, router.isFallback]);

  const edited = useMemo(() => {
    if (post.last_publication_date !== post.first_publication_date) {
      return undefined;
    }
    return {
      date: format(new Date(post.last_publication_date), 'd MMM yyyy', {
        locale: ptBR,
      }),
      hour: format(new Date(post.last_publication_date), 'HH:mm', {
        locale: ptBR,
      }),
    };
  }, [post.last_publication_date, post.first_publication_date]);

  if (router.isFallback) {
    return <span>Carregando...</span>;
  }

  // TODO
  return (
    <>
      <Header />
      <div className={styles.banner}>
        <div>
          <img src={post.data.banner.url} alt="banner" />
        </div>
      </div>
      <div className={commonStyles.container}>
        <h1 className={styles.title}>{post.data.title}</h1>
        <div className={styles.grid}>
          <div>
            <FiCalendar />{' '}
            <time>
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </time>
          </div>
          <div>
            <FiUser /> <span>{post.data.author}</span>
          </div>
          <div>
            <FiClock /> <span>{`${timeOfReading} min`}</span>
          </div>
          {edited && (
            <h4>
              * editado em {edited.date}, às {edited.hour}
            </h4>
          )}
        </div>
        {post.data.content.map(content => (
          <div key={content.heading} className={styles.content}>
            <h2>{content.heading}</h2>
            <div
              className={styles.contentBody}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{
                __html: RichText.asHtml(content.body),
              }}
            />
          </div>
        ))}
        <div className={styles.navigation}>
          {navigation.prevPost ? (
            <div>
              {navigation.prevPost.data.title}
              <Link href={`/post/${navigation.prevPost.uid}`}>
                <a>Post anterior</a>
              </Link>
            </div>
          ) : (
            <div />
          )}
          {navigation.nextPost ? (
            <div>
              {navigation.nextPost.data.title}
              <Link href={`/post/${navigation.nextPost.uid}`}>
                <a>Proxímo post</a>
              </Link>
            </div>
          ) : (
            <div />
          )}
        </div>
        <div id="inject-comments-for-uterances" />
        {preview && (
          <aside className={styles.exitPreview}>
            <Link href="/api/exit-preview">
              <a>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: [],
      pageSize: 2,
    }
  );

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  // TODO
  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  previewData,
  preview = false,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref ?? null,
  });

  const nextPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'post'), {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date desc]',
      fetch: ['post.uid', 'post.title'],
    })
  ).results[0];

  const prevPost = (
    await prismic.query(Prismic.predicates.at('document.type', 'post'), {
      pageSize: 1,
      after: `${response.id}`,
      orderings: '[document.first_publication_date]',
      fetch: ['post.uid', 'post.title'],
    })
  ).results[0];

  const navigation = {
    prevPost: prevPost || null,
    nextPost: nextPost || null,
  };

  // TODO
  return {
    props: {
      post: response,
      navigation,
      preview,
    },
    revalidate: 60 * 60, // 1 hour
  };
};
