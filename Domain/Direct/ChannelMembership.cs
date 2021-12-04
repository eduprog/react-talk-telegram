﻿namespace Domain.Direct
{
    public class ChannelMembership
    {
        public string AppUserId { get; set; }
        public AppUser AppUser { get; set; }
        public int ChannelId { get; set; }
        public ChannelChat Channel { get; set; }
        public MemberType MemberType { get; set; }
    }
}