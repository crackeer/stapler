import rehypeExternalLinks from 'rehype-external-links'

export default function externalLink() {
    return {
        rehype: (processor) => processor.use(rehypeExternalLinks,  {target: '_blank', rel: ['nofollow']}),
    }
}