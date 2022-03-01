import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import Prismic from '@prismicio/client';

import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
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
}

export default function Post({ post }: PostProps): JSX.Element {
  function getTimeOfReading(): number {
    const qty = post.data.content.reduce((acc, curr) => {
      const headingLength = curr.heading.split(' ').length;
      const bodyLength = curr.body.reduce((bodyAcc, bodyCurr) => {
        return bodyAcc + bodyCurr.text.split(' ').length;
      }, 0);
      return acc + (bodyLength + headingLength);
    }, 0);

    const time = Math.ceil(qty / 200);

    return time;
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
            <FiCalendar /> <time>{post.first_publication_date}</time>
          </div>
          <div>
            <FiUser /> <span>{post.data.author}</span>
          </div>
          <div>
            <FiClock /> <span>{getTimeOfReading()} min</span>
          </div>
        </div>
        {post.data.content ? (
          post.data.content.map(content => (
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
          ))
        ) : (
          <div className={styles.content}>carregando...</div>
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

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    first_publication_date: format(
      new Date(response.first_publication_date),
      'dd MMM yyyy'
    ),
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content,
    },
  };

  // TODO
  return {
    props: {
      post,
    },
  };
};
